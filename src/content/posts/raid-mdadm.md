---
title: 'Linux 软 RAID 实战指南：使用 mdadm 构建可靠存储'
slug: 'raid-mdadm'
published: 2026-02-10 14:18:34
updated: 2026-07-26 13:19:17
description: '在 Ubuntu Server 上用 mdadm 把两块以上数据盘做成软 RAID，承载 Docker 等应用数据——从磁盘准备、RAID 1 创建、持久化挂载，到故障磁盘替换、mdmonitor 邮件/Bark 告警的完整流程。'
image: https://img.olinl.com/file/post-img/cover/6QqEMPCW.webp
category: 系统运维
tags: [RAID, mdadm]
draft: false
pinned: false
---

## 为什么要做这件事

Ubuntu Server 上跑一堆 Docker 容器，数据都落在某一块数据盘上——**单盘 = 单点故障**，盘一坏数据全没。**软 RAID** 是成本最低、最通用的冗余方案：不用阵列卡、不用特殊硬件，两块空闲盘 + 半小时就能把可靠性拉高一个量级。

本文记录从零做一套 **RAID 1（镜像）** 的完整流程：准备磁盘 → 创建阵列 → 持久化 → 挂载到 `/data` 给 Docker 用 → 故障盘替换 → **邮件 + Bark 告警**。

> [!IMPORTANT] RAID ≠ 备份
> RAID 防的是**单块磁盘硬件故障**。以下场景 RAID **完全不保护**：
> - 误删、误 `rm -rf`
> - 勒索病毒、应用 bug 写坏数据
> - 文件系统损坏、同时多盘坏
> - 电源 / 控制器 / 主板问题打穿所有盘
> **RAID 是高可用方案，不是备份方案。** 重要数据仍然要做独立备份（rsync 到另一台机器 / PBS / 云盘都行），两者互不替代。


## 1. RAID 级别速览

本文只用 RAID 1，但选型思路通用，列一张对比表方便以后扩展：

| 级别 | 最少盘数 | 容错 | 读性能 | 写性能 | 容量利用率 | 典型场景 |
|------|---------|------|-------|-------|-----------|---------|
| RAID 0 | 2 | ❌ 无 | 最快 | 最快 | 100% | 临时 scratch 数据，丢了无所谓 |
| **RAID 1** | 2 | 任 1 盘 | 快（双路读） | 单盘速度 | 50% | **系统盘、数据量不大的重要数据** |
| RAID 5 | 3 | 任 1 盘 | 快 | 中（parity 计算） | (N-1)/N | 大容量 + 成本敏感 |
| RAID 6 | 4 | 任 2 盘 | 快 | 慢（双 parity） | (N-2)/N | 大盘组（4 TB+），怕 URE |
| RAID 10 | 4 | 每 mirror 1 盘 | 最快 | 很快 | 50% | 数据库、高 IO 负载 |

> [!TIP] 小规模 HomeLab 优先选 RAID 1
> 两块相同容量的盘做 RAID 1，**可用性最高、操作最简单、故障场景最容易理解**。RAID 5/6 容量利用率高但有"写惩罚"和 rebuild 期间再坏盘就全丢的风险，建议 4 盘以上再考虑。

## 2. 前置条件

- Ubuntu Server（本文基于 22.04 / 24.04 验证）
- 至少 **2 块容量相同的空闲数据盘**（容量不同也能做，但会以小盘为准，多出来的浪费）
- root / sudo 权限

先看看当前磁盘：

```bash
lsblk
# 假设 sda 是系统盘、sdb 和 sdc 是要做 RAID 的数据盘
```

> [!WARNING] 严重提醒：下面的操作会抹掉目标盘
> 后续 `wipefs` / `parted` / `mdadm --create` 都是**不可逆破坏性操作**。
> - 执行前务必用 `lsblk` + `sudo fdisk -l` 反复确认目标盘
> - **绝对不要把系统盘（通常是 `/dev/sda` 或 `/dev/nvme0n1`）当成目标盘**
> - 不确定时，先 `mount | grep <盘名>` 看盘是否被系统挂着

## 3. 准备磁盘

```bash
# 再次确认目标盘
lsblk
sudo fdisk -l /dev/sdb /dev/sdc

# 擦除磁盘元数据（旧分区表、文件系统签名、RAID 残留等）
sudo wipefs -a /dev/sdb
sudo wipefs -a /dev/sdc

# 创建 GPT 分区表
sudo parted /dev/sdb --script mklabel gpt
sudo parted /dev/sdc --script mklabel gpt

# 创建占满整盘的分区（0% 100% 让 parted 自动做 4K 对齐）
sudo parted /dev/sdb --script mkpart primary 0% 100%
sudo parted /dev/sdc --script mkpart primary 0% 100%

# 设置 RAID 标志，告诉内核这些分区将用作 RAID 成员
sudo parted /dev/sdb --script set 1 raid on
sudo parted /dev/sdc --script set 1 raid on

# 确认：应该看到 sdb1 和 sdc1，大小相同
lsblk
```

> [!TIP] GPT 上的 "primary" 是什么
> GPT 分区表**没有** primary / extended 的概念（那是 MBR 老术语）。`parted mkpart primary ...` 里的 `primary` 在 GPT 上只是充当分区名字，不影响功能。用 `mkpart data` 或其他名字也一样。

## 4. 创建 RAID 1 阵列

```bash
sudo mdadm --create --verbose /dev/md0 \
  --level=1 \
  --raid-devices=2 \
  /dev/sdb1 /dev/sdc1
```

- `/dev/md0`：RAID 设备节点名字，多个阵列时递增（md0、md1...）
- `--level=1`：RAID 级别（想换别的级别就改这里，对应第 1 节表格）
- `--raid-devices=2`：参与成员数量

命令执行后，阵列**立即开始首次同步**——把两块盘的数据对齐（即使现在都是空盘也会全盘对齐一次）。

## 5. 监控同步进度

```bash
# 实时看同步进度（5 秒刷新一次即可，太频繁反而占 CPU）
watch -n 5 cat /proc/mdstat

# 或单次看详细状态
sudo mdadm --detail /dev/md0
```

**判定同步完成**需要两个条件同时满足：

1. 状态显示 `[UU]`（两块盘都是 Up）
2. **没有** `resync`、`recovery` 这种进度行

例如完成状态的输出：

```
md0 : active raid1 sdc1[1] sdb1[0]
      1048512 blocks super 1.2 [2/2] [UU]

unused devices: <none>
```

同步期间阵列仍可使用（性能略低），但推荐等完成再挂数据。

## 6. 持久化配置
> [!NOTE] mdadm 配置文件路径因发行版而异
> - **Debian / Ubuntu**：`/etc/mdadm/mdadm.conf`（本文用这个）
> - **CentOS / RHEL / Rocky**：`/etc/mdadm.conf`（**没有** mdadm 子目录）
> - 对应的 initramfs 刷新命令：Debian/Ubuntu 是 `update-initramfs -u`，CentOS/RHEL 是 `dracut -f`


先 dry-run 看要写入什么：

```bash
sudo mdadm --detail --scan
# 输出类似：
# ARRAY /dev/md0 metadata=1.2 name=server-01:0 UUID=abcd1234:5678efgh:9012ijkl:3456mnop
```

然后写进配置文件，**根据系统是否已存在其他 mdadm RAID**选一种方式：

### 6.1 方式 A：追加（系统上已经有其他 RAID 时选这个）

```bash
sudo mdadm --detail --scan | sudo tee -a /etc/mdadm/mdadm.conf
```

`tee -a` 的 `-a` 是 **append（追加）**，原文件里的条目保留，新阵列追加到末尾。适合"加阵列"场景。

### 6.2 方式 B：备份后覆盖（全新系统、只做这一个 RAID）

```bash
# 先备份原文件
sudo cp /etc/mdadm/mdadm.conf /etc/mdadm/mdadm.conf.bak

# 然后覆盖写入
sudo mdadm --detail --scan | sudo tee /etc/mdadm/mdadm.conf
```

好处是文件干净、无历史残留；坏处是一旦手误漏写了某个阵列的 UUID，重启后那个阵列就识别不出来——好在有 `.bak` 备份可以恢复。

> [!WARNING] 不要裸用 tee 覆盖
> 直接 `... | sudo tee /etc/mdadm/mdadm.conf`（**不加 `-a`、不备份**）是最危险的写法。如果系统里已有其他 mdadm RAID，原配置会被**直接抹掉**，重启后那个阵列认不出来。不确定时选 6.1 的追加方式更稳。


### 6.3 更新 initramfs

```bash
sudo update-initramfs -u
```

这一步把 RAID 配置打包进内核启动镜像。对**数据盘** RAID 不是强制必需，但做了可以避免极个别"重启后 `/dev/md0` 变成 `/dev/md127`"之类的扫盘顺序问题。

## 7. 创建文件系统并挂载

```bash
# 创建 ext4 文件系统
sudo mkfs.ext4 /dev/md0

# 创建挂载点
sudo mkdir -p /data

# 临时挂载一下看是否正常（重启会失效，下一步才是开机自动挂载）
sudo mount /dev/md0 /data

# 确认
df -h /data
```

### 7.1 写入 `/etc/fstab`，让重启后自动挂载

用 UUID 挂载比用 `/dev/md0` 更稳（设备名有概率变成 md127 之类）：

```bash
# 获取 md0 的 UUID
UUID=$(sudo blkid -s UUID -o value /dev/md0)

# 追加到 fstab
echo "UUID=$UUID /data ext4 defaults 0 2" | sudo tee -a /etc/fstab

# 验证 fstab 语法没错（不会真的重新挂载，只是 lint）
sudo mount -a
```

强烈建议**重启一次实际测试**一下：

```bash
sudo reboot
# 重启后：
df -h /data          # 应该能看到
cat /proc/mdstat     # 应该 [UU]
```

> [!TIP] fstab 最后两列的含义
> - **第 5 列 `0`**：dump 备份工具的扫描标志，现在都不用 dump，填 `0`
> - **第 6 列 `2`**：fsck 启动时的检查顺序——根分区填 `1`，其他数据分区填 `2`，不检查填 `0`

## 8. 故障磁盘替换

RAID 1 的核心价值：一块盘挂了另一块继续工作，换盘后 rebuild 即可，**不丢数据**。

### 8.1 识别故障盘

```bash
cat /proc/mdstat
```

正常：

```
md0 : active raid1 sdc1[1] sdb1[0]
      ... [2/2] [UU]
```

有盘故障：

```
md0 : active raid1 sdc1[1](F) sdb1[0]
      ... [2/1] [U_]
```

`[U_]` 的下划线就是挂掉的那一块，`(F)` 标志位也印证了状态是 failed。

### 8.2 把故障盘正式移除

```bash
# 先标记为 fail（状态已经 fail 的也要走这一步）
sudo mdadm --manage /dev/md0 --fail /dev/sdc1

# 再从阵列里移除
sudo mdadm --manage /dev/md0 --remove /dev/sdc1
```

### 8.3 物理换盘 + 对新盘分区

```bash
# 新盘插上后，假设还是识别为 /dev/sdc
sudo wipefs -a /dev/sdc
sudo parted /dev/sdc --script mklabel gpt
sudo parted /dev/sdc --script mkpart primary 0% 100%
sudo parted /dev/sdc --script set 1 raid on
```

### 8.4 加回阵列，自动开始 rebuild

```bash
sudo mdadm --manage /dev/md0 --add /dev/sdc1

# 观察 rebuild 进度
watch -n 5 cat /proc/mdstat
```

`/proc/mdstat` 会多出一行 `recovery = X% (done)`。rebuild 期间阵列**仍可用**（降级模式），性能略低；等 `[UU]` 且无 recovery 行即恢复完成。

### 8.5 上线前的故障演练（推荐新手做一次）

RAID 坏盘的那一刻通常来得毫无预警。上线前主动模拟一次，心里有数：

```bash
# 手动把 sdc1 标记为故障
sudo mdadm --manage /dev/md0 --fail /dev/sdc1
cat /proc/mdstat    # 此时应进入降级状态 [U_]

# 模拟完成后，把它重新加回来观察 rebuild
sudo mdadm --manage /dev/md0 --remove /dev/sdc1
sudo mdadm --manage /dev/md0 --add /dev/sdc1
watch -n 5 cat /proc/mdstat
```

走完一遍，真出故障时直接按流程复刻，不会临时抓瞎。

## 9. 故障监控与告警

RAID 坏了一块盘后如果没人注意，下一步很可能又坏一块——两块都坏就全丢。**必须配监控告警**。

Ubuntu 装 mdadm 时会自动装 mdmonitor 服务（systemd 单元通常名为 `mdmonitor` 或 `mdadm`，视版本而定），它周期性扫描所有阵列，一旦状态变化就按配置好的方式通知。

### 9.1 邮件通知（传统方式）

```bash
# 在 /etc/mdadm/mdadm.conf 里加一行邮件地址
echo "MAILADDR your-email@example.com" | sudo tee -a /etc/mdadm/mdadm.conf

# 重启 mdmonitor 服务
sudo systemctl restart mdmonitor

# 触发一条测试通知
sudo mdadm --monitor --scan --test --oneshot
```

前提是这台机器本身能发邮件（装了 `postfix` / `msmtp` / `ssmtp` 等本地邮件转发工具）。对 HomeLab 用户这往往比较麻烦——下面的 HTTP Webhook 方式更现代。

### 9.2 HTTP Webhook 通知（推荐，以 Bark 为例）

[Bark](https://github.com/Finb/Bark) 是 iOS 上一个免费的 Push 应用，服务端只需要发 HTTP POST。配置思路：

1. mdmonitor 发现故障 → 调用 `PROGRAM` 指定的脚本
2. 脚本里用 `curl` POST 到 Bark API → 手机收到推送

**第 1 步**：在 iPhone 上安装 Bark App，复制它给你的 API URL（形如 `https://api.day.app/your_device_key`）。

**第 2 步**：写通知脚本 `/usr/local/bin/mdadm-notify.sh`：

```bash
sudo tee /usr/local/bin/mdadm-notify.sh > /dev/null <<'EOF'
#!/bin/bash
# mdmonitor 触发时以三个参数调用本脚本：
#   $1 = 事件类型 (Fail / DegradedArray / RebuildFinished / TestMessage 等)
#   $2 = 涉及的阵列 (如 /dev/md0)
#   $3 = 涉及的成员盘 (Fail 等事件会带，其他可能为空)

EVENT="$1"
ARRAY="$2"
DEV="$3"

BARK_KEY="your_device_key_here"        # ← 改成你自己的 key
HOSTNAME="$(hostname)"

curl -s -X POST "https://api.day.app/$BARK_KEY" \
  --data-urlencode "title=[$HOSTNAME] RAID $EVENT" \
  --data-urlencode "body=Array: $ARRAY  Device: $DEV" \
  --data-urlencode "group=mdadm" \
  > /dev/null
EOF

sudo chmod +x /usr/local/bin/mdadm-notify.sh
```

**第 3 步**：在 `/etc/mdadm/mdadm.conf` 里加一行，让 mdmonitor 触发这个脚本：

```
PROGRAM /usr/local/bin/mdadm-notify.sh
```

**第 4 步**：重启 mdmonitor 并测试：

```bash
sudo systemctl restart mdmonitor

# 触发一条测试事件，会同时调用 PROGRAM 脚本和 MAILADDR 邮件
sudo mdadm --monitor --scan --test --oneshot
```

iPhone 应该立即收到一条 Bark 推送，标题类似 `[server-01] RAID TestMessage`，说明链路已通。

**换成其他服务同理**：把 `curl` 里的 Bark URL 换成企业微信机器人、钉钉机器人、Discord / Telegram Bot、Gotify / ntfy 等任一个接收 HTTP POST 的服务即可。

> [!TIP] 邮件 + HTTP 建议同时配
> `MAILADDR` 和 `PROGRAM` 可以并存，mdmonitor 会两个都触发。关键数据盘推荐都配上——万一 Bark 服务抖动，还有邮件作兜底通道。

## 10. 销毁 / 停用 RAID

以后如果不想用 RAID 了（换方案、要拆盘、清理旧环境），正确的流程：

```bash
# 1. 卸载文件系统
sudo umount /data

# 2. 从 /etc/fstab 里删除对应行（避免下次开机挂载失败阻塞启动）
sudo sed -i '/\/data/d' /etc/fstab

# 3. 停止阵列
sudo mdadm --stop /dev/md0

# 4. 擦除每块成员盘上的 mdadm 超级块（关键！）
sudo mdadm --zero-superblock /dev/sdb1
sudo mdadm --zero-superblock /dev/sdc1

# 5. 从 /etc/mdadm/mdadm.conf 里删掉对应的 ARRAY 行（手动编辑）
sudo nano /etc/mdadm/mdadm.conf

# 6. 更新 initramfs
sudo update-initramfs -u

# 7. (可选) 完全擦磁盘，准备做新用途
sudo wipefs -a /dev/sdb
sudo wipefs -a /dev/sdc
```

> [!WARNING] 第 4 步 --zero-superblock 最容易漏
> 不擦掉超级块的话，这两块盘上的 RAID 元数据还在，下次你想用它们建别的 RAID、或当普通盘用时，系统会报警或"默默把它们认成旧阵列的一部分"。务必执行。


## 11. 常见故障排查

| 现象 | 可能原因 | 对策 |
|------|---------|------|
| `mdadm --create` 报 `not large enough` | 两块盘实际可用空间不一致（哪怕标称一样） | 用 `--size=<具体值>` 显式指定较小值，单位 K |
| 重启后 `/data` 没自动挂载 | fstab 里用了 `/dev/md0` 但设备名变了 | 改用 UUID（见 7.1 节） |
| 重启后 `/dev/md0` 变成 `/dev/md127` | mdadm.conf 里没有该阵列的 ARRAY 行，或 initramfs 没更新 | 重写 mdadm.conf + `sudo update-initramfs -u` |
| Rebuild 速度很慢 | 内核默认速度上限偏低 | `echo 200000 \| sudo tee /proc/sys/dev/raid/speed_limit_max`（单位 KB/s） |
| mdmonitor 不发通知 | 服务没起 / mdadm.conf 格式错 / MAILADDR 写错 | `systemctl status mdmonitor` + `journalctl -u mdmonitor` 看日志 |
| Bark 脚本不触发 | PROGRAM 路径错 / 脚本没可执行权限 | 确认脚本已 `chmod +x`，首行是 `#!/bin/bash` |
| 换完盘 `--add` 后 rebuild 立刻失败 | 新盘也有问题 / 新分区比老分区小 | SMART 检查新盘；确认新分区 ≥ 老分区 |



> 本文基于 Ubuntu Server 22.04 / 24.04 + 数据盘 RAID 的场景整理。  
> 对 CentOS / RHEL 系读者，主要差异是 `/etc/mdadm.conf`（无子目录）和 `dracut -f` 替代 `update-initramfs -u`；其他命令和流程通用。  
> 如果要做**系统盘 RAID**（root / boot 在 RAID 上），复杂度显著提升——涉及 GRUB、initramfs 内的 raid 模块、metadata 版本选择等，本文不涉及。
