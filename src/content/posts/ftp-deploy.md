---
title: GitHub Actions FTP 自动部署教程
published: 2026-07-28
updated: 2026-07-28
description: 从踩坑到实战，教你用 GitHub Actions 自动构建博客并部署到自己的 FTP 服务器。
image: https://img.olinl.com/file/post-img/cover/lkqasBlA.webp
category: 站点与部署
tags:
  - CI/CD
  - FTP
  - GitHub Actions
  - 教程
draft: false
lang: zh-CN
slug: ftp-deploy
---

> [!IMPORTANT]
> 此教程由 DeepSeek V4 Flash 编写，顾拾柒提供思路主导。

## 写在前面

群友问能不能搞个 GitHub Action 自动把博客部署到他的服务器上，我寻思不就传个文件的事嘛，分分钟搞定。结果一折腾就是一下午。

> [!TIP] 适用场景
> 自己的云服务器配置比较低，跑不动 `pnpm build`（比如 1C2G 的小鸡），但又想用自己服务器的带宽和存储。这种情况下，可以利用 **GitHub Actions 的免费构建资源** 来编译站点，再把产物推到你的服务器上。

> [!NOTE]
> 如果你有更好的服务器，可以直接在服务器上进行构建，可以直接使用 GitHub 的 web hook 去动态拉取、构建等等。

## 踩坑一：逐文件上传

一开始用的是 GitHub Marketplace 上最流行的 `SamKirkland/FTP-Deploy-Action`：

```yaml
- uses: SamKirkland/FTP-Deploy-Action@v4.3.5
  with:
    server: ${{ secrets.FTP_HOST }}
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    local-dir: ./dist/
    server-dir: /
```

结果跑起来就报错：

```
Error: Timeout when trying to open data connection to ***:39487
```

![能跑起来就需要超长时间](https://img.olinl.com/file/post-img/images/uU0qy728.webp)

控制连接能登录、能列目录，但**传文件就超时**。这就要从 FTP 的协议设计说起了——FTP 分两条连接：

| 类型 | 作用 | 特点 |
|------|------|------|
| **控制连接** | 登录、发指令 | 固定端口，稳如老狗 |
| **数据连接** | 传输文件内容 | 另开端口，随缘连通 |

问题就出在这个数据连接上。FTP 有两种模式建立数据连接：

- **被动模式（PASV）**：服务器开放一个随机端口，客户端主动连过去
- **主动模式（PORT）**：客户端开放一个端口，服务器连回来

理论上 GitHub Actions 连服务器应该用被动模式，但我的服务器当时走的是 FRP 内网穿透，只转发了控制端口（21），数据端口被防火墙拦死了。被动模式连不上。

那换成主动模式试试？结果 GitHub Actions 的运行器也没有公网 IP 让服务器连回来。

> [!WARNING]
> **被动模式**客户端过不去，**主动模式**服务端过不来——逐文件传这条路走不通。

## 踩坑二：打包上传

既然传多文件要反复建立数据连接容易翻车，那**只传一个文件**不就完事了？

```bash
tar -czf dist.tar.gz -C dist .
curl -T dist.tar.gz \
  --connect-timeout 30 \
  --retry 3 \
  --user user:pass \
  ftp://server.com/dist.tar.gz
```

curl 自带的 FTP 客户端处理数据连接比那个 Action 稳得多，而且只建立一个数据连接，传完就断，完全没有之前的端口问题。

果然一次成功。但问题来了——**传上去的是个压缩包，网站没法直接跑**。所以还需要在服务器上配一个自动解压的定时任务。

## 正式教程

### 第一步：创建工作流文件

在 GitHub 仓库中创建 `.github/workflows/deploy.yml`，路径如下：

```
你的仓库/
├── .github/
│   └── workflows/
│       └── ftp-deploy.yml         ← 新建这个文件
├── src/
├── public/
└── ...
```

> [!NOTE]
> 如果 `.github/workflows` 目录不存在，手动创建即可。

将以下内容粘贴进去：

```yaml
name: FTP 部署

on:
  push:
    branches: [ master ]
  workflow_dispatch:

concurrency:
  group: "ftp-deploy"
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: ⚡ 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: 📦 设置 pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9.14.4
          run_install: false

      - name: 🔗 安装依赖
        run: pnpm install --frozen-lockfile

      - name: 🔨 构建站点
        run: pnpm run build

      - name: 📦 打包并上传
        run: |
          tar -czf dist.tar.gz -C dist .
          curl -T dist.tar.gz \
            --connect-timeout 30 \
            --retry 3 \
            --retry-delay 5 \
            ftp://${{ secrets.FTP_HOST }}:${{ secrets.FTP_PORT }}/dist.tar.gz \
            --insecure \
            --user ${{ secrets.FTP_USERNAME }}:${{ secrets.FTP_PASSWORD }}
```

### 第二步：配置 GitHub Secrets

在 GitHub 仓库页面点击 **Settings → Secrets and variables → Actions**，然后点击 **New repository secret**，依次添加以下四个密钥：

| Secret 名称 | 说明 | 示例 |
|-------------|------|------|
| `FTP_HOST` | FTP 服务器地址 | `192.168.1.1` 或 `ftp.example.com` |
| `FTP_PORT` | FTP 服务器端口 | `21` |
| `FTP_USERNAME` | FTP 用户名 | `blog_user` |
| `FTP_PASSWORD` | FTP 密码 | `your_password` |

![配置 GitHub Secrets](https://img.olinl.com/file/post-img/images/p4hVhMyo.webp)

> [!NOTE]
> 依次添加 FTP_HOST、FTP_PORT、FTP_USERNAME、FTP_PASSWORD 四个密钥

### 第三步：安装并配置 FTP 服务端

以宝塔面板为例，进入 **软件商店 → Pure-FTPd → 安装**。

![安装 Pure-FTPd](https://img.olinl.com/file/post-img/images/v7Z4SP7X.webp)

然后添加 FTP 账号：**宝塔 → FTP → 添加账号**，目录指向你的网站根目录。

### 第四步：防火墙放行端口

**宝塔面板 → 安全 → 系统防火墙 → 添加端口规则**：

| 选项 | 值 |
|------|-----|
| 端口 | `39000-40000` |
| 协议 | TCP |
| 来源 | 全部 |

![防火墙放行端口](https://img.olinl.com/file/post-img/images/vbXCIAxy.webp)

> [!WARNING]
> 宝塔放行后，如果用的是云服务器（阿里云/腾讯云等），还需要去云厂商的控制台 **安全组** 中放行同样的端口。

完成后重启 Pure-FTPd：

```
宝塔 → 软件商店 → Pure-FTPd → 重启
```

### 第五步：配置网站域名

**宝塔 → 网站 → 添加站点**，输入你的域名，根目录选择一个目录（比如 `/www/wwwroot/blog`）。

### 第六步：添加自动解压计划任务

由于我们上传的是压缩包，服务器需要自动解压。**宝塔 → 计划任务 → 添加计划任务**：

| 选项 | 值 |
|------|-----|
| 任务名称 | 自动部署 |
| 任务类型 | Shell脚本 |
| 执行周期 | N分钟 → 1 |
| 脚本内容 | `cd /www/wwwroot/你的网站目录 && [ -f dist.tar.gz ] && tar -xzf dist.tar.gz && rm -f dist.tar.gz` |

![添加计划任务](https://img.olinl.com/file/post-img/images/1p2PRfMR.webp)

> [!TIP]
> 把 `你的网站目录` 替换成实际的路径，比如 `/www/wwwroot/blog`。

### 第七步：运行工作流

将上述所有配置提交并推送到 GitHub：

```bash
git add .
git commit -m "添加 FTP 自动部署"
git push
```

推送后，进入 GitHub 仓库页面，点击 **Actions** 选项卡，就能看到正在运行的工作流：

![工作流运行](https://img.olinl.com/file/post-img/images/jOVYuXlV.webp)

等待几分钟，构建 + 上传完成后，访问你的域名就能看到更新后的网站了。以后每次 `git push` 都会自动触发部署。

## 总结

回过头来看，不过是传一些静态文件到服务器这么简单的事，结果绕了一大圈。

主要教训就两条：

1. **FTP 的两连接设计在今天的网络环境里真的很要命。** NAT、防火墙、容器、CI 运行器……随便一个都能让数据连接翻车。
2. **能传一个文件就别传一万个。** 单文件的 curl 上传比逐文件反复建连接稳定太多了。

最终方案：**tar 打包 + curl 上传 + 宝塔计划任务自动解压**，简单可靠。
