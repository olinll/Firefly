---
title: Xtrabackup MySQL 热备份工具使用指南
slug: xtrabackup-backup
published: 2026-01-13
updated: 2026-01-13
description: 介绍 Percona Xtrabackup 的安装配置与全量备份操作，支持不停机热备份 MySQL 数据库，适用于生产环境数据保护。
image: "api"

category: 中间件与服务
tags: [MySQL, XtraBackup, 备份]
draft: false
# pinned: false                                  # 置顶
---

Xtrabackup 是 Percona 公司开发的 MySQL 开源热备份工具，支持在不停止数据库服务的情况下进行全量和增量备份。

> 相关文章：[CentOS 安装 MySQL 5.7 完整指南](/posts/centos-mysql57/)

## 一、安装

```bash
# 下载二进制包
wget https://downloads.percona.com/downloads/Percona-XtraBackup-LATEST/Percona-XtraBackup-8.1.0-1/binary/tarball/percona-xtrabackup-8.1.0-1-Linux-x86_64.glibc2.17.tar.gz

# 解压并安装
tar -zxvf percona-xtrabackup-8.1.0-1-Linux-x86_64.glibc2.17.tar.gz
mv percona-xtrabackup-8.1.0-1-Linux-x86_64.glibc2.17 /app/xtrabackup

# 配置软链接（使命令全局可用）
ln -sf /app/xtrabackup/bin/* /usr/bin/

# 验证安装
xtrabackup --version
```

## 二、MySQL 配置要求

备份前需在 `/etc/my.cnf` 中启用 GTID：

```ini title="/etc/my.cnf"
gtid_mode=ON
enforce_gtid_consistency=ON
```

## 三、创建备份专用用户

MySQL 8.1 起必须使用非 root 用户执行备份：

```sql
-- 创建备份用户
CREATE USER 'bkpuser'@'localhost' IDENTIFIED BY 's3cr%T';

-- 授予必要权限
GRANT BACKUP_ADMIN, PROCESS, RELOAD, LOCK TABLES, REPLICATION CLIENT ON *.* TO 'bkpuser'@'localhost';
GRANT SELECT ON performance_schema.log_status TO 'bkpuser'@'localhost';
GRANT SELECT ON performance_schema.keyring_component_status TO 'bkpuser'@'localhost';
GRANT SELECT ON performance_schema.replication_group_members TO 'bkpuser'@'localhost';
```

:::tip

各权限用途说明：

- `RELOAD`：执行 `FLUSH TABLES WITH REDO LOCK`
- `REPLICATION CLIENT`：查询 binlog 位点信息
- `BACKUP_ADMIN`：执行 `LOCK INSTANCE FOR BACKUP`
- `PROCESS`：查询 InnoDB 状态和进程列表

:::

## 四、全量备份

```bash
mkdir -p /app/backup

# 执行全量备份（带压缩）
xtrabackup --backup \
  --slave-info \
  -u bkpuser \
  -H 127.0.0.1 \
  -P 3306 \
  -p 's3cr%T' \
  --compress \
  --parallel=5 \
  --target-dir=/app/backup/backup_$(date +"%F_%H_%M_%S")
```

直接压缩为 gz 文件：

```bash
xtrabackup --backup -u bkpuser -H 127.0.0.1 -P 3306 -p 's3cr%T' \
  --stream=xbstream | gzip > /app/backup/backup_$(date +"%F_%H_%M_%S").gz
```

## 编辑建议

> 以下建议基于本条目内容生成，仅供发布前参考。

### 文章内容建议
- 文章只覆盖了"全量备份 + 压缩"，**完全缺失"恢复（prepare + copy-back）"流程**——这对一篇 MySQL 备份文章是致命短板，建议补"## 五、恢复"章节，给出 `xtrabackup --prepare --target-dir=...` 和 `xtrabackup --copy-back --target-dir=...` 完整命令
- 缺少"增量备份"章节：Xtrabackup 的核心优势就是 `--incremental` + LSN 链式备份，建议在第四节后增加"## 五、增量备份"，对比全量耗时与磁盘占用
- 缺少"自动化与定时任务"实战：建议增加"## 七、cron + 保留策略"小节，给出每天全量 + 每周归档的 crontab 示例，配合 `find -mtime +7 -delete` 自动清理
- 缺少"备份验证"机制：建议补"定期演练恢复"的提醒——很多生产事故源自"备份存在但恢复失败"

### 修改建议
- 文中密码 `s3cr%T` 是明文硬编码且与文档示例完全相同，强烈建议改为 `${MYSQL_PWD}` 环境变量读取或 `--login-path` 方式，**并在文首加 `:::warning` 警告**
- 第四章命令里的 `$(date +"%F_%H_%M_%S")` 在并发备份场景下会产生相同文件夹名（同一秒内），建议改为 `$(date +"%F_%H_%M_%S_%N")` 纳秒时间戳
- frontmatter `category: 服务与应用运维` 中没有 `Xtrabackup` 关键词，但 `tags` 用了 `MySQL, 备份, 运维`——可考虑把"备份"从 tag 移到 category 中突出定位

### 合并建议
- 候选合并对象：`postgresql-backup`、`centos-mysql-57`、`ubuntu-mysql-81`
- 合并理由：均属"数据库运维/备份"主题
- 综合判断：建议保留独立篇目——Xtrabackup 是独立工具链，与 `centos-mysql-57`（安装）、`postgresql-backup`（PG 工具）内容不重叠；但应在文末"相关文章"中互引 `centos-mysql-57` 和 `ubuntu-mysql-81`，形成"MySQL 部署-使用-备份"完整链路

### slug 建议
- 当前：`xtrabackup-backup`
- 建议：保留
- 理由：slug 包含工具名和动作，搜索友好；如要更精确可改 `mysql-xtrabackup-hot-backup`，但当前命名已足够清晰

### 分类建议
- 建议归类到：**服务**（现 `服务与应用运维` 准确）
- 理由：MySQL 备份属于"服务"分类下的"数据库"子域

### tags 建议
- 建议：`[Xtrabackup, MySQL, 备份]`
- 与现状对比：`[MySQL, 备份, 运维]`，差异说明：把"运维"换成"Xtrabackup"（专有名词），保留核心主题；与 1-3 个 tag 规则对齐

### 其他建议
- 配图建议：补一张"备份流程时序图"（备份→压缩→归档→清理）会比纯命令更易读
- 文档稳定性建议：wget 的 `Percona-XtraBackup-8.1.0-1` 版本号是写死的，建议在文末加"如版本更新请访问 [Percona Downloads](https://www.percona.com/downloads) 获取最新 URL"，避免链接 404
