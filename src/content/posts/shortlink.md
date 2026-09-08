---
title: 'Firefly 魔改：基于 Astro redirects 的短链接系统'
slug: 'shortlink'
published: 2026-07-04 17:30:50
updated: 2026-07-22 19:30:00
description: '基于 Astro 内置 redirects 的轻量短链系统，让访客可以轻松记住你的链接。'
image: https://img.olinl.com/file/post-img/shortlink/cover.webp
category: Firefly 二次开发
tags: [Firefly, 博客, 二开, Astro]
series: Firefly 博客搭建与二次开发
seriesOrder: 6
draft: false
pinned: false
---

有些页面路径太长了，比如「QQ 交流群」那篇文章的链接是 `/posts/qq-group/`，分享给别人时不太方便。如果能有一个 `/q` 短链接跳转过去就好了。

本文介绍如何用 Astro 自带的 `redirects` 功能，搭建一个零依赖的短链接/重定向系统。

## 一、设计思路

核心思路很简单：利用 Astro 的 `redirects` 配置项，在构建时生成静态重定向页面。

> [!NOTE] 原理
> Astro 在 `astro.config.mjs` 中提供了 `redirects` 字段，允许你为每个短路径指定目标 URL。构建时 Astro 会自动生成对应的 HTML 重定向页面（`<meta refresh>` 或适配器级别的 301 跳转），无需额外运行时。

我们希望支持两类目标：
- **内部路径**：如 `/q` → `/posts/qq-group/`
- **外部链接**：如 `/avatar-qlogo` → `https://q2.qlogo.cn/...`

## 二、实现步骤

### 1. 定义类型

先写好类型声明：

```typescript title="src/types/redirectsConfig.ts"
export interface RedirectsConfig {
  [key: string]: string;
}
```

就是简单的 `Record<string, string>`，key 是源路径，value 是目标路径或 URL。

### 2. 编写配置

```typescript title="src/config/redirectsConfig.ts"
import type { RedirectsConfig } from "../types/redirectsConfig";

export const redirectsConfig: RedirectsConfig = {
  "/q": "/posts/qq-group/",
  "/link": "/friends/",
  "/f": "/friends/",
  "/avatar-qlogo": "https://q2.qlogo.cn/headimg_dl?dst_uin=9892214&spec=0",
};
```

添加新短链只需要在这里加一行映射，非常轻量。

### 3. 导出 barrel

新增的配置和类型需要在 barrel 文件中注册导出：

```typescript title="src/config/index.ts" ins={6}
// ... 其他导出
export { musicPlayerConfig } from "./musicConfig";
export { navBarConfig, navBarSearchConfig } from "./navBarConfig";
export { live2dWidgetConfig, spineModelConfig } from "./pioConfig";
export { plantumlConfig } from "./plantumlConfig";
export { redirectsConfig } from "./redirectsConfig"; // 重定向/短链接配置
export { profileConfig } from "./profileConfig";
```

```typescript title="src/types/config.ts" ins={5}
// ... 其他导出
export type { Live2DWidgetConfig, SpineModelConfig } from "./pioConfig";
export type { PlantUMLConfig } from "./plantumlConfig";
export type { RedirectsConfig } from "./redirectsConfig";
export type { ProfileConfig } from "./profileConfig";
```

### 4. 接入 Astro 配置

在 `astro.config.mjs` 中导入并配置 `redirects` 字段：

```javascript title="astro.config.mjs" del={1} ins={2,10}
import { expressiveCodeConfig, fontConfig, fontsList, plantumlConfig, siteConfig } from "./src/config";
import { expressiveCodeConfig, fontConfig, fontsList, plantumlConfig, redirectsConfig, siteConfig } from "./src/config";

export default defineConfig({
    site: siteConfig.site_url,
    base: "/",
    trailingSlash: "always",

    // 短链接 / 重定向配置
    redirects: redirectsConfig,

    // 字体配置
    fonts: (() => { /* ... */ })(),
});
```

> [!TIP] 路径一致性
> 我开启了 `trailingSlash: "always"` 配置，确保重定向路径末尾统一带斜杠，避免重复的 301 跳转。

## 三、相关文件

配置：[/src/config/redirectsConfig.ts](https://github.com/olinll/firefly-blog/blob/master/src/config/redirectsConfig.ts)

类型：[/src/types/redirectsConfig.ts](https://github.com/olinll/firefly-blog/blob/master/src/types/redirectsConfig.ts)

接入：[/astro.config.mjs](https://github.com/olinll/firefly-blog/blob/master/astro.config.mjs)

相关源码：[olinll/firefly-blog](https://github.com/olinll/firefly-blog)

## 四、使用效果

- 访问 `/q` → 自动跳转到 QQ 交流群文章
- 访问 `/link` → 跳转到友链页
- 访问 `/avatar-qlogo` → 直接获取 QQ 头像

## 🔗 最后

这个系统的最大优点是**零额外依赖**——完全利用 Astro 内置能力，没有引入任何运行时库，构建时静态生成，性能零损耗。以后添加新短链只需要在配置文件中加一行，非常方便。
