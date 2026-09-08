---
title: 'PowerShell SSH 效率手册：免密、别名与端口转发'
slug: 'powershell-ssh-config'
published: 2026-03-07
updated: 2026-07-26 13:31:43
description: '在 Windows PowerShell 下用 OpenSSH 实现 ed25519 免密登录、SSH Config 短别名、本地/远程/动态三种端口转发以及多密钥管理。'
image: https://img.olinl.com/file/post-img/cover/db5kEm31.webp
category: 系统运维
tags: [PowerShell, SSH, OpenSSH]
draft: false
pinned: false
---

Windows 10+ 自带的 OpenSSH 客户端已经很完善，配合 PowerShell Profile 和 SSH Config，运维里最常用的连服务器、免密、端口转发都能用一套干净的方式管理。本文记录我自己用得最顺手的一套配置。

## 1. 本地生成密钥（只需执行一次）

在本地 PowerShell 运行：

```powershell
# 确保 .ssh 目录存在（全新账户第一次使用 SSH 时必要）
if (!(Test-Path $HOME\.ssh)) { New-Item -ItemType Directory $HOME\.ssh | Out-Null }

# 生成 ed25519 密钥，-N '' 表示不设密码
ssh-keygen -t ed25519 -N '' -f "$HOME\.ssh\id_ed25519"

# 查看公钥内容
Get-Content $HOME\.ssh\id_ed25519.pub
```

> [!TIP] 为什么选 ed25519
> ed25519 是目前推荐的密钥算法：公钥一行搞定、生成速度快、安全性更高。RSA 只在需要兼容十多年前的老系统时才需要考虑。

**要不要给密钥加 passphrase？**

上面用 `-N ''` 生成的是**无密码私钥**，方便但一旦文件泄露就直接失守。对安全要求更高可以去掉 `-N ''`、交互式输入一个 passphrase。然后用 `ssh-agent` 托管密钥，每次登录不用反复输 passphrase：

```powershell
# 启用 ssh-agent 服务并设为开机自启（PowerShell 以管理员身份运行一次）
Start-Service ssh-agent
Set-Service ssh-agent -StartupType Automatic

# 把密钥加入 agent（只需执行一次，之后重启电脑也会自动加载）
ssh-add $HOME\.ssh\id_ed25519
```

## 2. 服务器端免密配置

把公钥送上服务器有三种方式，**推荐方式 A**（一行命令，不依赖额外工具）。

### 2.1 方式 A：pipe 到 ssh 自动写入（推荐）

```powershell
Get-Content $HOME\.ssh\id_ed25519.pub | ssh user@1.2.3.4 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

命令会：读取本地公钥 → SSH 送到服务器 → 自动追加到 `authorized_keys` → 顺手把目录和文件权限都设对。执行时输一次密码，完成后下次起就免密。

### 2.2 方式 B：ssh-copy-id（OpenSSH 新版本自带）

较新的 OpenSSH 客户端内置了 `ssh-copy-id`，效果和方式 A 一致但命令更短：

```powershell
ssh-copy-id user@1.2.3.4
```

Windows 自带的 OpenSSH 不一定带这个命令（看版本），如果提示 `The term 'ssh-copy-id' is not recognized`，直接用方式 A。

### 2.3 方式 C：手动粘贴（兜底）

登录服务器后手动执行（需要先把公钥内容复制到剪贴板）：

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh && \
echo "这里粘贴公钥内容" >> ~/.ssh/authorized_keys && \
chmod 600 ~/.ssh/authorized_keys
```

:::caution[免密配好后建议禁用密码登录]

公钥登录正常工作后，推荐在服务器 `/etc/ssh/sshd_config` 里改成：

```
PubkeyAuthentication yes
PasswordAuthentication no
```

然后 `sudo systemctl reload ssh`（Debian/Ubuntu 是 `ssh`，CentOS/RHEL 是 `sshd`）。这样服务器只接受密钥登录，彻底消除密码被爆破的风险。

**两条关键保险**：

1. 修改前务必先用密钥登录一次，确认公钥配置无误。
2. 修改和 reload 期间**保留一个已登录的 SSH 窗口别关**——万一配置语法错、reload 失败或被防火墙误杀，可以从这个窗口里回滚，而不是被锁在门外。
:::

## 3. SSH 端口转发的三种模式

SSH 内置 3 种端口转发模式，分别应对不同场景：

| 模式 | 参数 | 方向 | 典型场景 |
|------|------|------|---------|
| 本地转发 | `-L` | 本地 → 远程 | 访问远程内网 Web / DB |
| 远程转发 | `-R` | 远程 → 本地 | 把本地服务暴露给远端（内网穿透） |
| 动态转发 | `-D` | SOCKS 代理 | 浏览器流量整条走 SSH |

### 3.1 本地转发（-L）——最常用

把**远端能访问的资源**映射到**本地端口**。比如服务器上跑着只监听 `127.0.0.1:8080` 的内部 Web 面板：

```powershell
# 格式：ssh -L [本地端口]:[远端可访问地址]:[远端端口] 用户@服务器IP
# 示例：把服务器的 127.0.0.1:8080 映射到本地 8080
ssh -L 8080:127.0.0.1:8080 user@1.2.3.4
```

连上后，本地浏览器访问 `http://localhost:8080` 就是在访问服务器上的服务。

常用参数：

- `-N`：只建隧道，不打开远程 shell
- `-f`：执行命令前 fork 到后台（通常和 `-N` 一起用，让 SSH 进程进入后台运行）

### 3.2 远程转发（-R）——内网穿透

方向相反：把**本地能访问的服务**暴露给远端。比如想让服务器访问你本地 3000 端口的服务：

```powershell
# 把本地 localhost:3000 映射到服务器的 8000 端口
ssh -R 8000:localhost:3000 user@1.2.3.4
```

服务器上访问 `http://127.0.0.1:8000` 就是访问你本地的 3000，常用于给服务器演示本地 demo、接收 webhook 调试等。

> [!WARNING] -R 默认只监听 127.0.0.1
> 服务器上 `-R` 暴露出来的端口默认只绑定 `127.0.0.1`，外部机器访问不到。如果要让公网或局域网也能访问，需要在服务器 `sshd_config` 里开启 `GatewayPorts yes`——安全敏感，谨慎使用。


### 3.3 动态转发（-D）——SOCKS 代理

把 SSH 当成本地 SOCKS5 代理：

```powershell
# 在本地 1080 端口起 SOCKS5 代理，所有流量走服务器
ssh -D 1080 -N user@1.2.3.4
```

浏览器把代理设成 SOCKS5 `127.0.0.1:1080` 后，所有网页请求都会经服务器出口。相当于**一条 SSH 连接就能当整套代理**，临时用不需要单独装 Clash / v2ray 这类工具。

## 4. 短别名与自动端口转发：两种方案

每次敲 `ssh -L ... user@ip` 又长又容易出错。下面两种方案都能做到"一个词解决"，按需选一种或两种搭配用。

### 4.1 方案一：SSH Config 文件（推荐）

**优点**：声明式配置；命令行、Git、SCP 等各种 SSH 工具都认；一次配置终身受益。

**步骤**：

1. 打开配置文件：

   ```powershell
   notepad $HOME\.ssh\config
   ```

2. 写入内容：

   ```ssh-config
   # --- 基础服务器：只做登录 ---
   Host s1
       HostName 1.2.3.4
       User user
       Port 22                # 非默认端口（如 22222）就改这里
       IdentityFile ~/.ssh/id_ed25519

   # --- 带自动端口转发的同一台服务器 ---
   Host s1-tunnel
       HostName 1.2.3.4
       User user
       Port 22
       IdentityFile ~/.ssh/id_ed25519
       # LocalForward [本地端口] [目标地址]:[目标端口]
       LocalForward 18789 127.0.0.1:18789
       LocalForward 3306 127.0.0.1:3306
   ```

3. 使用：

   ```powershell
   ssh s1              # 纯登录
   ssh s1-tunnel       # 登录 + 自动把 18789 / 3306 映射到本地
   ```
> [!TIP] 用 IdentityFile 管理多密钥
> 如果不同服务器需要不同密钥（比如公司机和 HomeLab 分开），在每个 `Host` 块下单独写 `IdentityFile`，SSH 会按主机挑对应密钥，不会把所有私钥依次试一遍（那样很快就会撞到服务器端 `MaxAuthTries` 限制被拒绝）。


### 4.2 方案二：PowerShell Profile 函数

**优点**：启动时可以打印友好提示、函数里能塞任意 PowerShell 逻辑（例如连前先 `Test-NetConnection` 探活）。

**步骤**：

1. 打开 Profile：

   ```powershell
   notepad $PROFILE
   ```

2. 写入函数：

   ```powershell
   # 1. 纯连接
   function s1 { ssh user@1.2.3.4 }

   # 2. 一键开启端口转发并显示提示
   function s1-tunnel {
       Write-Host "------------------------------------------------" -ForegroundColor Cyan
       Write-Host "SSH 隧道已建立！" -ForegroundColor Green
       Write-Host "Web 应用: http://localhost:18789" -ForegroundColor Yellow
       Write-Host "数据库端口: 3306 -> 3306" -ForegroundColor Yellow
       Write-Host "提示: 保持此窗口开启，按 Ctrl+C 关闭隧道" -ForegroundColor DarkGray
       Write-Host "------------------------------------------------" -ForegroundColor Cyan
       # -N 表示不执行远程命令，仅做转发
       ssh -N -L 18789:127.0.0.1:18789 -L 3306:127.0.0.1:3306 user@1.2.3.4
   }
   ```

3. 让配置生效并使用：

   ```powershell
   . $PROFILE       # 立即加载本次会话
   s1-tunnel        # 直接输入函数名
   ```

### 4.3 两种方案对比

| 维度 | Config 方式 | Profile 方式 |
|------|-----------|-------------|
| 打字量 | `ssh s1-tunnel`（中等） | `s1-tunnel`（最少） |
| 可维护性 | 高（标准格式、跨工具通用） | 一般（仅 PowerShell 生效） |
| 自动化能力 | 声明式配端口，无逻辑 | 可写任意 PowerShell 脚本逻辑 |
| 推荐度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐（补充） |

**建议方案一为主、方案二为辅**：能用 Config 解决的就用 Config，需要彩色提示 / 脚本逻辑时再走 Profile 函数。

## 5. 常见故障排查

| 报错 | 原因 | 对策 |
|------|------|------|
| `Permissions 0644 for 'id_ed25519' are too open` | 本地私钥权限过松 | PowerShell 运行 `icacls $HOME\.ssh\id_ed25519 /inheritance:r /grant:r "$($env:USERNAME):F"`，或手动在文件属性里只保留当前用户可读 |
| 服务器侧 `Permission denied (publickey)` | `~/.ssh` 或 `authorized_keys` 权限不对 | 服务器上执行 `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys` |
| 端口转发报 `bind: Address already in use` | 本地端口被其他进程占用 | PowerShell 里 `Get-NetTCPConnection -LocalPort 8080` 定位占用进程 |
| 能连上但卡很久才出提示符 | 服务器开了 `UseDNS` 但反向解析失败 | 服务器 `sshd_config` 里设 `UseDNS no` 后重启 sshd |
| 没明显报错但连不上 / 认证反复失败 | 需要更详细调试信息 | 加 `-v` / `-vv` / `-vvv` 打印握手日志（见下方） |

遇到复杂问题时的万能调试命令：

```powershell
ssh -vvv s1-tunnel
```

输出会逐步打印 SSH 协议握手的每个阶段，对密钥不匹配、配置未生效、算法协商失败等问题定位非常有用。

---

本教程在 Windows 11 + OpenSSH 9.x 客户端上验证过。对端服务器可以是 Linux / macOS，SSH 协议两端一致，命令互通。
