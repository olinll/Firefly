---
title: 'Linux 服务器时间同步配置（Chrony）'
slug: 'chrony-time-sync'
published: 2026-02-01 14:18:34
updated: 2026-07-26 13:15:53
description: '使用 Chrony 工具为 Linux 服务器配置时间同步，支持阿里云、腾讯云等国内 NTP 源及内网 NTP 服务器。'
image: https://img.olinl.com/file/post-img/cover/kmSHZCiU.webp
category: 系统运维
tags: [运维, 时间同步]
draft: false
pinned: false
---


服务器时间同步非常重要，数据库、缓存、日志、监控等服务都依赖准确的时间。随着运行时间增长，系统时钟会产生漂移，建议通过 Chrony 定期同步。

## 一、设置时区

```bash
sudo timedatectl set-timezone Asia/Shanghai
```

## 二、安装 Chrony

```bash
# CentOS / RHEL
yum install -y chrony

# Ubuntu / Debian
apt install -y chrony
```

> [!NOTE]
> 如果服务器无法直连公网，可先配置 HTTP 代理再安装：
> ```bash
> export http_proxy=http://192.168.1.87:3128
> export https_proxy=http://192.168.1.87:3128
> ```

## 三、配置 NTP 服务器

```bash title="/etc/chrony.conf"
# 内网 NTP 服务器（优先）
server 192.168.1.244 iburst

# 国内公共 NTP 源（备用）
server ntp.aliyun.com iburst
server time1.cloud.tencent.com iburst
server ntp1.aliyun.com iburst
server ntp.sjtu.edu.cn iburst
server cn.ntp.org.cn iburst
```

## 四、启动服务

```bash
systemctl enable chronyd --now
systemctl status chronyd
```

## 五、验证时间同步

```bash
# 查看同步跟踪状态
chronyc tracking

# 查看时间源列表
chronyc sources -v
```

## 六、启用 NTP 并查看状态

```bash
timedatectl set-ntp true
timedatectl
