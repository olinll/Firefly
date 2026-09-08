---
title: Debian 13 稳定版安装指南及系统配置
slug: debian-setup
published: 2026-02-02 22:50:02
updated: 2026-07-26 09:45:52
description: 深入讲解 Debian 13 最小化安装与常用服务配置。涵盖 APT 优化与权限管理，助你掌握这款“通用操作系统”的极致稳定方案。
image: https://img.olinl.com/file/post-img/debian-setup/bfCm7lLc.webp
category: 系统运维
tags: ["系统安装", "Debian"]
draft: false
# pinned: false                                  # 置顶
---

## 一、下载镜像

国内用户推荐在「清华大学开源软件镜像站」的 [debian-cd 专属页面](https://mirrors.tuna.tsinghua.edu.cn/debian-cd/current/)，找到与你「设备架构」相匹配的 Debian 13 ISO 镜像，然后自行下载。

> [!NOTE]
> 建议根据你的设备架构，选择`iso-dvd`完整安装镜像。

amd 架构链接：[AMD - ISO DVD](https://mirrors.tuna.tsinghua.edu.cn/debian-cd/current/amd64/iso-dvd/)

## 二、开始安装

### 1. 选择安装类型

在 Debian 安装程序菜单中，选择 「**Graphical Install**」，以图形化界面启动 Debian 13 安装向导。

![选择安装类型](https://img.olinl.com/file/post-img/debian-setup/debian-install-710246.webp)

### 2. 选择语言

选择「安装向导」和系统中要使用的语言，然后点击「Continue」继续。国内的小伙伴选择「**中文（简体）**」即可。

![选择语言](https://img.olinl.com/file/post-img/debian-setup/debian-install-201960.webp)

### 3. 选择你的位置

选择你所在的地理位置，系统会以此自动为 Debian 13 设置时区。

![选择位置](https://img.olinl.com/file/post-img/debian-setup/debian-install-763428.webp)

### 4. 配置键盘

在列表中选择与你「实体键盘」相匹配的键盘布局，然后点击「继续」。

![配置键盘](https://img.olinl.com/file/post-img/debian-setup/debian-install-596146.webp)


### 5. 网络配置

在安装过程中，Debian 安装程序会尝试通过 DHCP 服务器，自动获取 IP 地址来配置网络：

- 如果获取成功，就会直接跳到「主机名」设置（这在安装「桌面版」时比较适用）。如果是安装 Debian 服务器，**可以在「主机名」设置界面点击「返回」，手动指定固定 IP**。
- 如果网络中没有可用的 DHCP 服务器，自动配置将会失败，也需要你手动指定 IP 地址。

> [!WARNING]
> 如果你的网络中有 DHCP 服务器，系统自动配置了，可以点击返回按钮，选择返回，然后按照下面教程继续即可
> 
> ![返回配置IP](https://img.olinl.com/file/post-img/debian-setup/debian-install-748551.webp)

#### 手动配置网络

1. 选择「手动配置网络」，然后点击「继续」。

![手动配置网络](https://img.olinl.com/file/post-img/debian-setup/debian-install-264800.webp)

2. 输入一个固定 IP 地址，然后点击「继续」。

> [!NOTE]
> 可以在这里输入 IP 地址/子网掩码，例如 `192.168.1.2/24`
> 
> 或者只输入 IP 地址，在后面配置子网掩码

![配置子网掩码](https://img.olinl.com/file/post-img/debian-setup/debian-install-862048.webp)

3. 输入网关 IP 地址，然后点击「继续」。通常会自动配置。

![配置网关](https://img.olinl.com/file/post-img/debian-setup/debian-install-333368.webp)

4. 输入 DNS 服务器，然后点击「继续」。如何要配置多个 DNS 服务器，可以用「空格」隔开。

![配置DNS](https://img.olinl.com/file/post-img/debian-setup/debian-install-670686.webp)

5. 为你的 Debian 13 系统设置一个 `hostname` 主机名，然后点击「继续」。

![配置主机名](https://img.olinl.com/file/post-img/debian-setup/debian-install-920560.webp)

6. 如果你有与网络关联的特定「域名」，可以在这里输入。一般情况下，我们会选择「留空」。

![](https://img.olinl.com/file/post-img/debian-setup/debian-install-704376.webp)

### 6. 设置 Root 密码

为`root`帐户设置一个强密码。

![设置Root密码](https://img.olinl.com/file/post-img/debian-setup/debian-install-587634.webp)

> [!NOTE] 强密码的标准
> | 要求  | 说明                              |
> | --- | ------------------------------- |
> | 长度  | 至少 8 位字符                        |
> | 复杂性 | 包含大小写字母、数字和特殊字符（如`@`、`#`、`$`等）。 |
> | 安全性 | 避免重复使用或容易被猜到的密码                 |

### 7. 创建新用户和密码

强烈建议你创建一个普通用户账户，作为日常操作使用。只在需要权限时再临时提权。

1. 输入新用户的全名，然后点击「继续」。可以和下一步的「用户名」不同。

![输入全名](https://img.olinl.com/file/post-img/debian-setup/debian-install-669571.webp)

2. 为这个用户设置一个用户名，只能用小写字母和数字，而且必须以字母开头。

![设置用户名](https://img.olinl.com/file/post-img/debian-setup/debian-install-875373.webp)

3. 为新用户设置一个强密码，最好是和 `root` 密码不同。

![设置新用户密码](https://img.olinl.com/file/post-img/debian-setup/debian-install-416543.webp)


### 8. 对磁盘进行分区

在这一步，我们要规划磁盘分区，主要有以下 4 个选项：

| 分区选项                  | 描述                               |
| --------------------- | -------------------------------- |
| 向导 – 使用整个磁盘           | 自动对整个磁盘进行分区，适合新手和 Homelab 虚拟机使用。 |
| 向导 – 使用整个磁盘并配置 LVM    | 自动设置 LVM 分区。                     |
| 向导 – 使用整个磁盘并配置加密的 LVM | 自动设置加密的 LVM 分区。                  |
| 手动                    | 自定义分区，自由度最高，适合有经验的用户。            |

通常我们选择 1 或者 2 即可

我这里推荐使用 LVM 进行分区

![LVM分区](https://img.olinl.com/file/post-img/debian-setup/debian-install-557392.webp)

选择你要分区的硬盘

![选择硬盘](https://img.olinl.com/file/post-img/debian-setup/debian-install-327772.webp)
如果没有特殊需求，推荐选择「将所有文件放在同一个分区中」，你也可以将`/home`、`/var`和`/tmp`等目录单独分区。

![分区](https://img.olinl.com/file/post-img/debian-setup/debian-install-755278.webp)

> [!TIP]
> 这里如果硬盘不是空的，会提示下面内容，我们直接选择是即可。
> 
> ![移除现有数据](https://img.olinl.com/file/post-img/debian-setup/debian-install-709516.webp)


选择「是」确认将修改写入磁盘并配置 LVM

![写入并配置LVM](https://img.olinl.com/file/post-img/debian-setup/debian-install-802899.webp)

这里默认保持最大空间即可

![硬盘分区空间](https://img.olinl.com/file/post-img/debian-setup/debian-install-555712.webp)

完成分区操作并将修改写入磁盘

![](https://img.olinl.com/file/post-img/debian-setup/debian-install-940129.webp)

选择「是」确认将改动写入磁盘，然后点击「继续」。

![写入磁盘](https://img.olinl.com/file/post-img/debian-setup/debian-install-602194.webp)

### 9. 开始安装基本系统

![开始安装](https://img.olinl.com/file/post-img/debian-setup/debian-install-365668.webp)

### 配置软件包管理器：更新源

安装向导会询问你是否扫描额外的安装介质，选择「否」继续。

![](https://img.olinl.com/file/post-img/debian-setup/debian-install-527438.webp)

选择「是」，启用网络镜像。（配置一个快速的国内源，对国内的小伙伴非常重要。）

![](https://img.olinl.com/file/post-img/debian-setup/debian-install-285339.webp)

国家选择「中国」，Debian 仓库镜像站点推荐选择 `tsinghua` 清华源。

![](https://img.olinl.com/file/post-img/debian-setup/debian-install-195050.webp)
![](https://img.olinl.com/file/post-img/debian-setup/debian-install-876653.webp)

如果你是直连网络，HTTP 代理信息就「留空」；如果有代理，就填写代理地址和端口号。

![配置代理](https://img.olinl.com/file/post-img/debian-setup/debian-install-373349.webp)

启用「软件包流行度调查」后，Debian 会定期收集你的软件使用数据。如果你不想参与，就选择「否」。

> [!TIP]
> 你也可以随时在「终端」中，执行以下命令来调整设置：
> 
> ```bash
> dpkg-reconfigure popularity-contest
> ```


![](https://img.olinl.com/file/post-img/debian-setup/debian-install-369588.webp)


### 10. 软件选择：桌面版还是服务器

Debian 是一款通用型 Linux 发行版，它不像 Ubuntu 那样，还单独区分桌面和服务器版本的 ISO 镜像。但你可以在「软件选择」时，来决定安装哪种类型：

- 勾选「Debian 桌面环境」，并至少选择一款桌面，就会安装桌面版。
- 如果不选「Debian 桌面环境」，那就是服务器版。

选择要安装的软件，推荐勾选上：

- **SSH server**：安装 SSH 服务器，方便远程管理。Homelab 环境可以启用 root 登录。
- **标准系统工具**：包括一些常用的基础工具包、命令行工具、网络工具和系统管理工具等。
- **Blends**：适用于教育、科研等特定场景的软件合集。


![](https://img.olinl.com/file/post-img/debian-setup/debian-install-968123.webp)

选择完毕后，点击「继续」，开始安装这些软件。

![](https://img.olinl.com/file/post-img/debian-setup/debian-install-278013.webp)

### 11. 安装 GRUB 启动引导器

选择「是」继续安装 GRUB 启动引导器。

![](https://img.olinl.com/file/post-img/debian-setup/debian-install-135285.webp)

选择要安装 GRUB 的磁盘，比如`/dev/sda`，然后点击「继续」。

![](https://img.olinl.com/file/post-img/debian-setup/debian-install-556969.webp)

最后,点击「继续」重启系统，完成 Debian 13 安装流程。

![](https://img.olinl.com/file/post-img/debian-setup/debian-install-910918.png)

## 三、配置系统

### 1. Root 账户允许远程登录

```bash
# 查看是否安装了SSH服务
ps -ef |grep ssh 

# 没有安装的话，执行下面语句
sudo apt-get update                   #先更新下资源列表
sudo apt-get install openssh-server   #安装openssh-server
sudo ps -ef | grep ssh                #查看是否安装成功
sudo systemctl restart sshd           #重新启动SSH服务 

# 进入ssh配置文件
vi  /etc/ssh/sshd_config
```

**修改Root远程登录权限**

```bash title="/etc/ssh/sshd_config"
#PermitRootLogin prohibit-password
PermitRootLogin yes # [!code ++]
```

> [!TIP]
> `PermitRootLogin` 是一个用于配置 SSH 服务器的选项。这个选项决定了是否允许 root 用户通过 SSH 直接登录到服务器。通常情况下，为了提高安全性，最好禁止 root 用户通过 SSH 直接登录，而是使用一个普通用户登录后再通过 su 或者 sudo 切换到 root 用户来执行需要特权的操作。这样可以降低系统受到攻击的风险。
> 
> 常见的 PermitRootLogin 选项取值包括：
> - `yes`：允许 root 用户通过 SSH 直接登录。
> - `no`：禁止 root 用户通过 SSH 直接登录。
> - `without-password`：允许 root 用户通过 SSH 密钥登录，但不允许使用密码登录。


**重启服务**

```bash
# 重启ssh服务
sudo systemctl daemon-reload
sudo systemctl restart ssh
```

### 2. 换国内源

因为我们已经在安装的时候选择清华大学源了，所以这里只需要将 CD-ROM 部分注释或者删除就可以了

```bash title="/etc/apt/sources.list"
# 删除或者注释掉这一行
#deb cdrom:[Debian GNU/Linux 13.3.0 _Trixie_ - Official amd64 DVD Binary-1 with firmware 20260110-11:00]/ trixie contrib main non-free-firmware

deb http://mirrors.tuna.tsinghua.edu.cn/debian/ trixie main non-free-firmware
deb-src http://mirrors.tuna.tsinghua.edu.cn/debian/ trixie main non-free-firmware

deb http://security.debian.org/debian-security trixie-security main non-free-firmware
deb-src http://security.debian.org/debian-security trixie-security main non-free-firmware

# trixie-updates, to get updates before a point release is made;
# see https://www.debian.org/doc/manuals/debian-reference/ch02.en.html#_updates_and_backports
deb http://mirrors.tuna.tsinghua.edu.cn/debian/ trixie-updates main non-free-firmware
deb-src http://mirrors.tuna.tsinghua.edu.cn/debian/ trixie-updates main non-free-firmware

```

更新系统及其软件包

```bash
apt update
apt upgrade
```

### 3. 修复sudo权限

Debian 和 Ubuntu 不同，如果在安装时设置了 `root` 密码，系统默认不会把普通用户加入 `sudo` 组，甚至连 `sudo` 命令都没装。

以下是修复步骤：

```bash
# 切换到 root 用户
su -

# 安装 sudo 软件包
apt update && apt install sudo -y

# 将普通用户加入 sudo 组
# 语法：usermod -aG sudo <你的用户名>
usermod -aG sudo olinl

# 使权限生效
## exit 退出或者索性 reboot重启

```

### 4. 开启 BBR 网络加速

既然是“最佳实践”配置，Debian 13 自带的高版本内核开启 BBR 只需要一行命令，能显著提升网络吞吐量，建议顺手做了：

```bash
# 开启 BBR
echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf

# 应用配置
sysctl -p

```

### 5. 让Debian命令行显示中文

```bash
# 方法A：直接编辑 /etc/profile（在文件末尾添加）
sudo tee -a /etc/profile << 'EOF'
# 系统级语言设置
export LANG=zh_CN.UTF-8
export LC_ALL=zh_CN.UTF-8
export PATH=$PATH:/usr/local/bin
EOF
```

## 四、安装必要软件

```bash
apt install wget curl vim zip unzip lsb-release tree htop net-tools lsof chrony tar lvm2 parted sudo -y
```

**安装 Intel 显卡工具包**

```bash
apt install vainfo intel-gpu-tools -y
```

- **wget**：用于从命令行下载文件，适合脚本和大文件拉取
- **curl**：用于发起 HTTP/API 请求，常用于接口测试和自动化
- **vim**：终端下的文本编辑器，用于修改配置和编写脚本
- **zip**：将文件打包成 zip 格式，方便跨平台传输
- **unzip**：解压 zip 压缩包
- **lsb-release**：用于识别当前 Linux 发行版和版本信息
- **tree**：以树状结构显示目录内容
- **htop**：交互式进程监控工具，用于查看 CPU 和内存使用情况
- **net-tools**：提供 netstat、ifconfig 等传统网络排错工具
- **lsof**：查看端口或文件被哪个进程占用
- **chrony**：高精度时间同步服务，保证系统时间准确
- **tar**：Linux 常用的打包和解包工具
- **lvm2**: 磁盘管理工具
- **parted**:磁盘管理工具



## 五、作为虚拟机安装 SR-IOV-guest 核显驱动 「PVE」

```bash

nano /etc/default/grub

# 在GRUB_CMDLINE_LINUX_DEFAULT后面加上 i915.enable_guc=3
#GRUB_CMDLINE_LINUX_DEFAULT="quiet"
GRUB_CMDLINE_LINUX_DEFAULT="quiet i915.enable_guc=3"

# 更新grub
update-grub

# 安装相关环境和依赖包
apt install -y dkms vainfo intel-media-va-driver wget firmware-linux linux-headers-$(uname -r)

# 下载sriov驱动
# https://github.com/strongtz/i915-sriov-dkms
wget https://github.com/strongtz/i915-sriov-dkms/releases/download/2025.12.10/i915-sriov-dkms_2025.12.10_amd64.deb

# 安装sriov驱动
sudo dpkg -i i915-sriov-dkms_*_amd64.deb

# 重启
reboot

```
