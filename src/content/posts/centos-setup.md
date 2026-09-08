---
title: CentOS 安装与服务器初始化配置完整指南
slug: centos-setup
published: 2026-01-31 23:11:03
updated: 2026-07-26 09:40:27
description: 详述 CentOS 从零安装、分区到网络与防火墙配置全流程。助你快速构建稳定、安全的生产级 Web 服务器环境。
image: https://img.olinl.com/file/post-img/centos-setup/yOVJbaKg.webp
category: 系统运维
tags:
  - 系统安装
draft: false
pinned: false
---

>[!IMPORTANT] CentOS停更说明
> 
> CentOS操作系统已全面停止维护（EOL），继续使用会使系统暴露在新的安全漏洞之下，成为攻击目标，并可能违反相关安全合规要求。
> 
> 阿里云：[CentOS 操作系统](https://help.aliyun.com/zh/ecs/user-guide/options-for-dealing-with-centos-linux-end-of-life)


## 一、下载镜像

Centos7镜像包：

```sql
# 华为云镜像站
https://mirrors.huaweicloud.com/centos/7/isos/x86_64/CentOS-7-x86_64-DVD-2009.iso
```

烧录镜像（二选一）

- 使用 [Ventoy启动盘](https://www.ventoy.net/cn/index.html)
- 使用 [Rufus](https://rufus.ie/zh/)
- 使用 [Balenaetcher](https://etcher.balena.io/)
- 或者第三方镜像烧录工具

之后启动到U盘，进入安装流程，里面没什么可说的，都是可视化安装，下一步下一步即可。

## 二、开始安装

网络配置可以在安装界面配置，也可以使用 dhcp 在安装完成后配置，但是开关一定要打开，不然无法使用SSH连接，如果在安装的时候没有网络，也可以关闭，然后后面手动开启网卡服务。

![网络配置 - 设置静态IP](https://img.olinl.com/file/post-img/centos-setup/H6ZhALpn.webp)

如果root密码设置过于简单，需要点击两次完成才可继续安装。

## 三、系统配置

在我们安装完成一个系统后，通常需要进行一些必要的优化

### 1. 修改 IP 地址

可以先ping一下外网是否可以访问

```bash
ping baidu.com
```

```bash
# 网络正常
[root@harbor ~]# ping baidu.com
PING baidu.com (110.242.74.102) 56(84) bytes of data.
64 bytes from 110.242.74.102 (110.242.74.102): icmp_seq=1 ttl=51 time=20.2 ms
64 bytes from 110.242.74.102 (110.242.74.102): icmp_seq=2 ttl=51 time=20.0 ms
64 bytes from 110.242.74.102 (110.242.74.102): icmp_seq=3 ttl=51 time=26.6 ms
64 bytes from 110.242.74.102 (110.242.74.102): icmp_seq=4 ttl=51 time=20.0 ms
64 bytes from 110.242.74.102 (110.242.74.102): icmp_seq=5 ttl=51 time=20.0 ms
^C
--- baidu.com ping statistics ---
5 packets transmitted, 5 received, 0% packet loss, time 4004ms
rtt min/avg/max/mdev = 20.061/21.424/26.605/2.595 ms
```

如果没有打印延迟等信息，就说明网络是断开的。

**查看网卡名称**

```bash
#查看网卡，通常是ens开头的
ip addr
```

```bash
# 查看网卡名称为ens33
[root@172-0-0-12 ~]# ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:0c:29:06:59:5c brd ff:ff:ff:ff:ff:ff
    inet 172.0.0.12/24 brd 172.0.0.255 scope global noprefixroute ens33
       valid_lft forever preferred_lft forever
    inet6 fe80::e1ff:d529:c8cb:6d1a/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
```

**修改网卡配置**

```bash
# 修改网卡配置
# vi /etc/sysconfig/network-scripts/ifcfg-<网卡名称>
vi /etc/sysconfig/network-scripts/ifcfg-ens33
```

修改关键字段：

```bash

BOOTPROTO=static
ONBOOT=yes
IPADDR=192.168.1.100
NETMASK=255.255.255.0
GATEWAY=192.168.1.1
DNS1=8.8.8.8

```

> `BOOTPROTO`=static - 静态ip  
> `ONBOOT`=yes - 启动时自动激活  
> `IPADDR`=192.168.1.100 - ip地址  
> `NETMASK`=255.255.255.0 - 掩码，通常为255.255.255.0  
> `GATEWAY`=192.168.1.1 - 网关  
> `DNS1`=8.8.8.8 - DNS地址  

修改完成后保存，重启network服务

```bash

service network restart

# 对于使用旧版network服务的系统
/etc/init.d/network restart
/etc/init.d/network stop && /etc/init.d/network start

```

然后就可以正常联网了。

### 2. 更换yum源

> [!TIP] 
> 由于centos7已经停止服务，部分源已经无法访问，如果显示404等问题，请自行寻找可用源


```bash

# 备份yum源
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup

# 下载国内yum源配置文件
## 如果无法使用可以手动创建文件然后复制进去
vi /etc/yum.repos.d/CentOS-Base.repo
## 阿里源（推荐）：
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
### 当wget无法使用时
#curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
## 网易源：
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.163.com/.help/CentOS7-Base-163.repo
### 当wget无法使用时
#curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.163.com/.help/CentOS7-Base-163.repo

# 清理yum缓存，并生成新的缓存
yum clean all
yum makecache

# 更新yum源
yum update -y

```

### 3. 硬盘操作

此操作可以借助lvm2工具，详细操作见另一篇文章：

[Olinl Blog - LVM 硬盘工具使用教程](/posts/lvm-setup/)

### 4. 配置 SELinux

SELinux 是 CentOS 7 的安全模块，它可以提高系统的安全性。但是，如果不正确配置，它可能会导致一些问题。以下是一些常见的 SELinux 配置

```bash

# 临时禁用SELinux
setenforce 0

# 永久禁用SELinux
vi /etc/selinux/config
## 修改为下面内容
SELINUX=disabled

#注意！修改后需重启系统才能生效

```

## 四、 安装必要的软件包

```bash

yum -y install  epel-release
yum -y install wget vim net-tools telnet lsof tree htop zip unzip iperf3

```

> [!NOTE]
> - wget：用于下载文件和网页
> - vim：用于编辑文本文件
> - net-tools：用于管理网络配置
> - telnet：用于测试网络连接
> - lsof：用于查看系统打开的文件
> - tree：用于查看目录结构
> - htop：用于更好的查看进程
> - zip、unzip：用于解压缩zip文件
> - iperf3：内网测速工具



## 五、防火墙操作

通常情况下我们使用的是 vpc，云厂商会自带防火墙服务，我们可以将防火墙直接关闭。

```bash

# 停止防火墙服务
systemctl stop firewalld.service
# 停止开机自启
systemctl disable firewalld.service

```

如果你认为系统的防火墙非常重要，想要使用，请往下看

**添加一个端口**

```bash

# 添加端口
## --permanent永久生效，没有此参数重启后失效
firewall-cmd --zone=public --add-port=5005/tcp --permanent

# 添加端口外部访问权限（这样外部才能访问）
firewall-cmd --add-port=5005/tcp

# 更新防火墙规则
firewall-cmd --reload

```

**查看端口是否开放**

```bash
firewall-cmd --zone=public --query-port=80/tcp
```

**删除开放的端口**

```bash
firewall-cmd --zone=public --remove-port=80/tcp --permanent
```

**查看firewall是否运行**

```bash
# 两个命令都可以
systemctl status firewalld

firewall-cmd --state
```

**查看开启了哪些服务**

```bash
firewall-cmd --list-services
```

**查看所有打开的端口**

```bash
firewall-cmd --zone=public --list-ports
```

## 六、一键运行脚本

**包含更新阿里yum源，安装软件包，关闭防火墙**

```bash
yum install wget -y
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
yum clean all
yum makecache
yum update -y
yum -y install  epel-release
yum -y install wget vim net-tools telnet lsof tree htop zip unzip iperf3
systemctl stop firewalld.service
systemctl disable firewalld.service
```

## 七、常用命令

### 1. 修改主机名

```bash
# 查看主机名
hostname
# 修改主机名
hostnamectl set-hostname 主机名
```

### 2. 配置免密登录

```bash
# 在A客户端上生成公钥和私钥
ssh-keygen -t rsa


# ====================================================
# 拷贝及配置方案
ssh-copy-id -i ~/.ssh/id_rsa.pub 'root@要拷贝到的机器ip'
```

### 3. 配置hosts

服务器多的时候可以配置hosts，直接通过关键字访问，避免使用ip访问，以免更换ip时还要修改配置

```bash title="/etc/hosts"

vim /etc/hosts

# 添加配置格式
#ip地址 别名
192.168.0.100 vm100

```

```bash title="或者使用heredoc写入"
# 使用heredoc写入
sudo tee -a /etc/hosts << EOF
192.168.0.100 vm100
EOF
```

### 4. 使用scp传输文件

**从服务器上下载文件**

例如：把 192.168.0.101 上的 /data/test.txt 的文件下载到 /home（本地目录）

```bash
#scp 用户名@服务器地址:要下载的文件路径 保存文件的文件夹路径
scp root@192.168.0.101:/data/test.txt /home
```

**上传本地文件到服务器**

例如：把本机 /home/test.txt 文件上传到 192.168.0.101 这台服务器上的 /data/ 目录中

```bash
#scp 要上传的文件路径 用户名@服务器地址:服务器保存路径
scp /home/test.txt root@192.168.0.101:/data/
```

**从服务器下载整个目录**

例如：把 192.168.0.101 上的 /data 目录下载到 /home（本地目录）

```bash
#scp -r 用户名@服务器地址:要下载的服务器目录 保存下载的目录
scp -r root@192.168.0.101:/data  /home/
```

**上传目录到服务器**

例如：把 /home 目录上传到服务器的 /data/ 目录

```bash
#scp -r 要上传的目录 用户名@服务器地址:服务器的保存目录
scp -r /home root@192.168.0.101:/data/
```

### 5. 安装rpm包

```bash
# 批量安装rpm
rpm -ivh *.rpm

# 查询并过滤已安装的软件包
## -qa 参数表示查询所有（-q）已安装的软件包（-a）grep表示过滤
rpm -qa | grep firefox

# 卸载
rpm -e firefox

# 带参数安装
rpm -ivh *.rpm --nodeps --force
```

### 6. 赋权

```bash
# 赋予读写权限
chmod -R 777 文件或目录
# chmod -R 777 /usr/local/mysql/*

# 赋予可执行权限
chmod +x 文件
```

### 7. 查看端口占用

```bash
yum -y install lsof

lsof -i tcp:80

# 关掉占用的服务
kill pid
kill -9 pid
```
