---
title: 'Linux 定期清理日志文件脚本（Crontab）'
slug: 'log-cleanup-script'
published: 2026-01-02
updated: 2026-07-26 13:31:43
description: '提供一个开箱即用的 Shell 脚本，用于管理 Java JAR 包服务的启动、停止、重启与状态查看，适合生产环境部署。'
image: https://img.olinl.com/file/post-img/cover/sB5401H7.webp
category: 系统运维
tags: [Shell, Java]
draft: false
pinned: false
---

日志文件不断累积会耗尽磁盘空间，影响服务稳定性。通过 Shell 脚本 + Crontab 可以自动清理超过指定天数的旧日志，同时保留近期日志以便问题追溯。


## 清理脚本

将以下内容保存为 `/app/clear-logfile.sh`，按需修改日志目录和保留天数：

```bash title="/app/clear-logfile.sh"
#!/bin/bash

# 日志目录（修改为实际路径）
LOG_DIR=/opt/app/logs
# 保留最近 N 天的日志
KEEP_DAYS=7

echo "开始清理日志..."

# 查找并删除超过 KEEP_DAYS 天的 .log 文件
find ${LOG_DIR}/* -mtime +${KEEP_DAYS} -name "*.log" -exec rm -rf {} + 2>&1

echo "日志清理完成"
```

>[!TIP]
> `find` 命令参数说明：
> 
> - `-mtime +7`：查找 7 天前修改的文件
> - `-name "*.log"`：只匹配 `.log` 文件，可改为 `*` 匹配所有文件
> - `-exec rm -rf {} +`：批量删除匹配到的文件


## 赋予执行权限

```bash
chmod +x /app/clear-logfile.sh
```

## 配置 Crontab 定时执行

```bash
crontab -e
```

添加以下内容（每天 23:00 执行）：

```bash
0 23 * * * /app/clear-logfile.sh
```

常用 Crontab 时间格式参考：

| 表达式 | 含义 |
|---|---|
| `0 23 * * *` | 每天 23:00 |
| `0 */6 * * *` | 每 6 小时 |
| `0 0 * * 0` | 每周日 00:00 |
| `0 0 1 * *` | 每月 1 日 00:00 |

```bash
# 查看已配置的定时任务
crontab -l
```
