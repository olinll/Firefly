---
title: 'Firefly 魔改：Umami Share API 浏览量展示'
slug: 'umami-views'
published: 2026-07-03 21:40:29
updated: 2026-07-22 19:30:00
description: '集成 Umami 统计并通过公开 Share API 在博客前端展示页面/文章浏览量。'
image: https://img.olinl.com/file/post-img/umami-views/cover.webp
category: Firefly 二次开发
tags: [Firefly, 博客, 二开, Umami, 统计]
series: Firefly 博客搭建与二次开发
seriesOrder: 3
draft: false
pinned: false
---

访问量数据不仅是站长关心的事，展示给访客也能增加内容的可信度。Umami 是一个开源的网站统计工具，本文将介绍如何在前端展示 Umami 浏览量数据。

## 一、小巧思：Share ID

通常情况下调用 Umami API 需要先登录获取 Token（`POST /api/auth/login` → 返回 `token` → 后续请求带 `Authorization: Bearer <token>`）。但这样做有两个问题：

1. 需要在客户端暴露用户名密码
2. Token 会过期，需要刷新逻辑

Umami 提供了一个「分享」功能——在 Umami 后台创建一个分享链接，会得到一个 `shareId`。访问 `/api/share/{shareId}` 即可获取一个临时 Token，后续请求携带 `x-umami-share-token` 头即可查询统计数据。

**关键点**：Share Token 只能查询公开数据，无法修改任何配置，安全性远高于管理员 Token。整个流程只需一个 `shareId`，无需暴露任何凭证。

## 二、配置

在配置文件中填入 Umami 信息和 Share ID：

```typescript title="src/config/analyticsConfig.ts"
export const analyticsConfig = {
  umamiAnalytics: {
    websiteId: "xxxx",                          // 站点 ID
    scriptUrl: "https://umami.example.com/umami.js",
    shareId: "xxxx",                             // 公开分享 ID
    shareApiBase: "https://umami.example.com",
    trackOutboundLinks: true,
    collectWebVitals: true,
  },
};
```

`shareId` 从 Umami 后台的「分享」功能获取，`shareApiBase` 是你的 Umami 实例地址。

> [!NOTE] 先决条件
> 浏览量数据依赖于 Umami 统计脚本采集。在接入浏览量展示之前，需要先在页面中注入 Umami 统计脚本（`<script defer src={scriptUrl} data-website-id={websiteId}>`），确保数据正在被采集。

## 三、Share Token 认证流程

整个数据获取的核心就是两步：

```typescript title="Share Token 认证流程"
// 1. 用 shareId 换取临时 Token
const share = await fetch(`${apiBase}/api/share/${shareId}`);
const { token, websiteId } = await share.json();

// 2. 用 Token 查询统计数据
const metrics = await fetch(
  `${apiBase}/api/websites/${websiteId}/metrics?type=path&limit=1000`,
  { headers: { "x-umami-share-token": token } }
);
const data = await metrics.json();
```

相比标准认证方式：

| 方式 | 凭证 | 风险 |
|---|---|---|
| 标准登录 | 用户名 + 密码 | 暴露在客户端 |
| Share Token | shareId | 只读、无权限 |

## 四、浏览量展示

在文章详情页的组件中嵌入占位元素，页面加载后统一请求数据并填充：

```astro title="src/components/layout/PostMeta.astro"
---
const showUmamiViews = !!shareId && !!postUrl;
---
{showUmamiViews && (
  <div data-umami-pv-path={postUrl}
       data-umami-share-id={shareId}
       data-umami-api-base={apiBase}>
    <span data-umami-pv-value>加载中...</span>
  </div>
)}
```

客户端脚本获取所有占位，统一请求后填充：

```typescript title="浏览量数据获取与填充"
const CACHE_KEYS = {
  share: "umami_share",
  metrics: "umami_metrics",
};
const TTL = { share: 86400000, metrics: 300000 }; // 24h / 5min

function getCache(key, ttl) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Date.now() - parsed.ts < ttl ? parsed.val : null;
  } catch { return null; }
}

function setCache(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), val }));
  } catch { /* 存储满等异常静默忽略 */ }
}

async function fetchViews(apiBase, shareId) {
  try {
    // 1. 获取 Share Token（缓存命中则跳过）
    let shareData = getCache(CACHE_KEYS.share, TTL.share);
    if (!shareData) {
      const res = await fetch(`${apiBase}/api/share/${shareId}`);
      if (!res.ok) return;
      shareData = await res.json();
      setCache(CACHE_KEYS.share, shareData);
    }

    // 2. 获取页面浏览量（缓存命中则跳过）
    let rows = getCache(CACHE_KEYS.metrics, TTL.metrics);
    if (!rows) {
      const res = await fetch(
        `${apiBase}/api/websites/${shareData.websiteId}/metrics?type=path&limit=1000`,
        { headers: { "x-umami-share-token": shareData.token } }
      );
      if (!res.ok) return;
      rows = await res.json();
      setCache(CACHE_KEYS.metrics, rows);
    }

    // 3. 填充所有占位
    const lookup = new Map(rows.map(r => [r.x, r.y]));
    document.querySelectorAll("[data-umami-pv-value]").forEach(el => {
      const path = el.closest("[data-umami-pv-path]")
        ?.getAttribute("data-umami-pv-path");
      el.textContent = path
        ? (lookup.get(path) ?? 0).toLocaleString()
        : "0";
    });
  } catch {
    // 网络错误 / JSON 解析失败等，保留默认 "0" 文案
  }
}
```

## 五、相关文件

配置：[/src/config/analyticsConfig.ts](https://github.com/olinll/firefly-blog/blob/master/src/config/analyticsConfig.ts)

统计组件：[/src/components/analytics/UmamiAnalytics.astro](https://github.com/olinll/firefly-blog/blob/master/src/components/analytics/UmamiAnalytics.astro)

浏览量展示：[/src/components/layout/PostMeta.astro](https://github.com/olinll/firefly-blog/blob/master/src/components/layout/PostMeta.astro)

相关源码：[olinll/firefly-blog](https://github.com/olinll/firefly-blog)

## 🔗 最后

Umami 的 Share API 是一个非常实用的功能——你可以在不暴露管理员权限的情况下，在前端展示统计数据。配合 24 小时/5 分钟的分层缓存策略，既保证了数据实时性，又避免了对 Umami 服务造成压力。
