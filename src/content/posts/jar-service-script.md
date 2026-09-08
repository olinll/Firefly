---
title: 'Linux 管理 JAR 服务的 Shell 脚本'
slug: 'jar-service-script'
published: 2026-01-02
updated: 2026-07-26 13:31:43
description: '提供一个开箱即用的 Shell 脚本，用于管理 Java JAR 包服务的启动、停止、重启与状态查看，适合生产环境部署。'
image: https://img.olinl.com/file/post-img/cover/pDq3xAxi.webp
category: 系统运维
tags: [Shell, Java]
draft: false
pinned: false
---

在生产环境中直接用 `java -jar` 启动服务不便管理，以下脚本封装了 start / stop / restart / status 四个操作，支持后台运行。

> 尚未安装 JDK？参见 [Linux 手动安装 JDK 1.8 并配置环境变量](/posts/jdk-install/)

## 使用方法

```bash
sh server.sh start    # 启动服务
sh server.sh status   # 查看状态
sh server.sh stop     # 停止服务
sh server.sh restart  # 重启服务
```

## 脚本内容

将以下内容保存为 `server.sh`，修改顶部的 `APP_NAME` 和 `APP_PATH` 为实际值：

```bash title="server.sh"
#!/bin/bash

# 修改为实际的 JAR 文件名（不含路径）
APP_NAME=app.jar
# 修改为 JAR 文件所在目录
APP_PATH=/opt/app/jar

usage() {
    echo "Usage: sh server.sh [start|stop|restart|status]"
    exit 1
}

is_exist() {
    pid=$(ps -ef | grep $APP_NAME | grep -v grep | awk '{print $2}')
    if [ -z "${pid}" ]; then
        return 1
    else
        return 0
    fi
}

start_log() {
    is_exist
    if [ $? -eq 0 ]; then
        echo "${APP_NAME} 启动成功！pid=${pid}"
    else
        echo "${APP_NAME} 启动失败，请检查后重试"
    fi
}

start() {
    is_exist
    if [ $? -eq 0 ]; then
        echo "${APP_NAME} is already running. pid=${pid}"
    else
        nohup java -jar ${APP_PATH}/${APP_NAME} > /dev/null 2>&1 &
        start_log
    fi
}

stop() {
    is_exist
    if [ $? -eq 0 ]; then
        kill -9 $pid
        echo "${APP_NAME} 已关闭！pid=${pid}"
    else
        echo "${APP_NAME} is not running"
    fi
}

status() {
    is_exist
    if [ $? -eq 0 ]; then
        echo "${APP_NAME} is running. Pid is ${pid}"
    else
        echo "${APP_NAME} is not running."
    fi
}

restart() {
    stop
    echo "${APP_NAME} 准备重启..."
    sleep 5
    start
}

case "$1" in
    "start")   start   ;;
    "stop")    stop    ;;
    "status")  status  ;;
    "restart") restart ;;
    *)         usage   ;;
esac
```

> [!TIP]
> 如果 JAR 包名称包含版本号等动态部分（如 `app-1.0.0.20240101.jar`），可将 `APP_NAME` 设置为固定前缀，并将启动命令改为：


```bash
nohup java -jar ${APP_PATH}/${APP_NAME}*.jar > /dev/null 2>&1 &
```

:::

## 赋予执行权限

```bash
chmod +x server.sh
```
