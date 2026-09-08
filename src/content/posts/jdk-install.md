---
title: Linux 手动安装 JDK 1.8 并配置环境变量
slug: jdk-install
published: 2026-01-05
updated: 2026-01-05
description: 通过下载 tar.gz 包手动安装 JDK 1.8，配置 JAVA_HOME 等环境变量，适用于 CentOS、Debian、Ubuntu 等主流发行版。
image: "api"

category: 中间件与服务
tags: [Java, JDK, 环境配置]
draft: false
# pinned: false                                  # 置顶
---

一般情况下推荐直接下载 tar.gz 包配置环境变量，而不是通过包管理器安装，便于管理多个 JDK 版本。

## 一、下载解压

```bash
# 下载 JDK 1.8
# 华为云官方地址
wget https://repo.huaweicloud.com/java/jdk/8u201-b09/jdk-8u201-linux-x64.tar.gz

# 解压并移动到 /opt
tar -zxvf jdk-8u201-linux-x64.tar.gz
mv jdk1.8.0_201 /opt/jdk1.8/
```

## 二、配置环境变量

```bash
# 编辑系统环境变量
vim /etc/profile

# 在文件末尾追加以下内容
# Java 1.8
export JAVA_HOME=/opt/jdk1.8
export PATH=$JAVA_HOME/bin:$PATH
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar

# 使配置立即生效
source /etc/profile

# 验证安装，显示版本号即成功
java -version
```

```bash
# 预期输出
java version "1.8.0_201"
Java(TM) SE Runtime Environment (build 1.8.0_201-b09)
Java HotSpot(TM) 64-Bit Server VM (build 25.201-b09, mixed mode)
```

:::tip

如果服务器上需要同时管理多个 JDK 版本，可以将不同版本分别解压到 `/opt/jdk1.8/`、`/opt/jdk11/`、`/opt/jdk17/` 等目录，通过修改 `JAVA_HOME` 快速切换。

:::

## 编辑建议

> 以下建议基于本条目内容生成，仅供发布前参考。

### 文章内容建议
- 建议补充"OpenJDK 11/17/21 主流版本安装"小节：JDK 1.8 已被 Oracle 商业授权收紧、且不再免费分发 LTS 公开更新；新部署建议改用 OpenJDK Temurin / Zulu / Amazon Corretto 等开源版本。
- 第一步下载的 `jdk-8u201-b09` 是 2019 年发布的老版本（含多个公开 CVE），建议升级到 `8u401+` 或显式说明"测试环境使用，生产请用 LTS 新版"。
- 建议补一段"apt/yum 安装 OpenJDK"作为快速路径对照：`apt install -y openjdk-17-jdk`，与 tar.gz 手动安装方式做选型表。
- 缺少"卸载"和"环境变量清理"步骤：升级 JDK 后旧目录如何处理、是否要从 `/etc/profile` 删除旧 `JAVA_HOME`、是否要 `update-alternatives --config java`，建议补一节"卸载与切换"。

### 修改建议
- 文中 `CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar` 在 JDK 9+ 已废弃（`tools.jar` 在模块化后被移除）；建议标注"仅适用于 JDK 1.8"，并提示"JDK 11+ 不需要 CLASSPATH"。
- `export PATH=$JAVA_HOME/bin:$PATH` 推荐把 `$JAVA_HOME/bin` 放在 `$PATH` 前面，避免与其他 Java 冲突；当前顺序正确，可补一句说明。
- 整篇文章只有 30+ 行，篇幅较短，建议把"下载/解压/环境变量/验证"四节合并为一张命令速查表 + 详细解释，避免读者在短文里跳来跳去。

### 合并建议
- 候选合并对象：`jar-service-script`（前置依赖，文中已外链）、`maven-install`（同是 Java 工具链，可考虑合并为 `java-dev-toolchain-install`）
- 合并理由：建议把 `jdk-install` + `maven-install` 合并为 `java-dev-environment-setup`，减少读者在多个零散文章间切换；不合并 `jar-service-script`（运维 vs 开发职责不同）。

### slug 建议
- 当前：`jdk-install`
- 建议：保留（也可考虑改为 `linux-jdk-install`）
- 理由：当前 slug 简洁明了，与文章标题强对位；如果要明确是 Linux 平台可改为 `linux-jdk-install`，与 `linux-software-raid-mdadm-guide`、`linux-openvpn-installation-guide` 等同系列命名风格保持一致。

### 分类建议
- 建议归类到：系统
- 理由：内容是 Linux 上手动安装 JDK 1.8 并配置环境变量，属于新分类"系统"中的"底层工具"；不是"开发"（不是 IDE 或构建工具），也不是"服务"（不涉及应用部署流程）。

### tags 建议
- 建议：`[JDK, Java, 安装]`
- 与现状对比：`["JDK", "Java", "环境配置"]`，差异说明：原 tags 中"环境配置"偏抽象，改为更精准的"安装"主题词（与 `docker-install`、`jdk-install` 命名习惯一致），便于聚合。

### 其他建议
- 建议在文末加一节"JDK 8 与 JDK 11/17 命令差异速查"：移除 `tools.jar`、默认 GC 改为 G1、模块化（module-path）等，让老 JDK 项目升级时少踩坑。
- 如果保留 JDK 1.8 主题，建议补一句商业授权提醒：Oracle JDK 8u211+ 不再免费商用，可改用 OpenJDK 8 替代（`yum install java-1.8.0-openjdk-devel`）。
