---
title: 'Firefly 魔改：集成 Memos API 作为动态数据源'
slug: 'memos-dynamic'
published: 2026-07-19 15:03:19
updated: 2026-07-22 19:30:00
description: '将 Memos 作为动态数据源，支持标签过滤和可见性控制，替代本地 content/dynamic/。'
image: https://img.olinl.com/file/post-img/memos-dynamic/cover.webp
category: Firefly 二次开发
tags: [Firefly, 博客, 二开, Memos, 动态]
series: Firefly 博客搭建与二次开发
seriesOrder: 8
draft: false
# pinned: false
---

之前在博客中维护动态内容需要手动编辑本地 Markdown 文件，比较繁琐。如果能直接用自建的 Memos 服务作为数据源，发布动态后自动同步到博客，体验会好很多。

![动态页完整效果](https://img.olinl.com/file/post-img/memos-dynamic/0001.webp)
## 一、设计思路

用 Memos 替代本地 `content/dynamic/` 集合，通过 API 代理层获取数据：

1. 配置 Memos 服务地址和 Token
2. 服务端 API 代理请求 Memos 数据（`src/pages/api/dynamic.json.ts`）
3. 支持标签过滤（只显示包含特定标签的 memo）
4. 支持可见性控制（仅公开/全部）
5. 降级处理：Memos 不可用时返回空数据

## 二、配置

`src/config/dynamicConfig.ts` 中配置 Memos 连接信息：

```typescript title="src/config/dynamicConfig.ts" ins={12-19}
export const dynamicConfig: DynamicConfig = {
    title: "",
    description: "",
    cover: {
        enable: true,
        image: "https://ph.0824.uk/file/博客横屏封面/1780635498430_mmexport1774845895097.jpg",
        greeting: "Hello 顾拾柒",
    },
    showComment: true,
    itemsPerPage: 20,

    // Memos 集成（配置后将从 Memos 拉取动态，忽略本地 content/dynamic/）
    memos: {
        serverUrl: "https://note.olinl.com",
        accessToken: "",
        pageSize: 100,
        visibility: "public",
        tags: ["blog"],
    },
};
```

`accessToken` 可留空（仅拉取公开 memo），`tags` 控制只显示带特定标签的动态。

类型定义在 `src/types/dynamicConfig.ts`：

```typescript title="src/types/dynamicConfig.ts"
export type DynamicConfig = {
    title?: string;
    description?: string;
    showComment?: boolean;
    itemsPerPage?: number;
    cover?: { enable: boolean; image: string; greeting?: string };
    memos?: {
        serverUrl: string;
        accessToken: string;
        pageSize?: number;
        visibility?: "all" | "public";
        tags?: string[];
    };
};
```

## 三、API 代理层

`src/pages/api/dynamic.json.ts` 是核心代理端点。文件放在 `src/pages/api/` 下，Astro 自动将其注册为 `/api/dynamic.json` 路由，无需额外配置。

```typescript title="src/pages/api/dynamic.json.ts"
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { dynamicConfig } from "@/config/dynamicConfig";

let processor: Awaited<ReturnType<typeof createMarkdownProcessor>> | null = null;
async function getProcessor() {
    if (!processor) processor = await createMarkdownProcessor();
    return processor;
}

const markdownImagePattern = /!\[([^\]]*)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/g;

interface MemoAttachment {
    name: string;
    filename: string;
    type: string;
    externalLink?: string;
}

interface Memo {
    name: string;
    content: string;
    createTime: string;
    displayTime?: string;
    visibility: string;
    tags?: string[];
    attachments?: MemoAttachment[];
}

interface MemosResponse {
    memos: Memo[];
}

async function fetchFromMemos(): Promise<
    {
        id: string;
        published: number;
        html: string;
        images: { alt: string; src: string }[];
        searchText: string;
    }[]
> {
    if (!dynamicConfig.memos) throw new Error("Memos config not found");
    const { serverUrl, accessToken, pageSize = 100, visibility = "public", tags } = dynamicConfig.memos;
    const baseUrl = serverUrl.replace(/\/+$/, "");
    const url = `${baseUrl}/api/v1/memos?pageSize=${pageSize}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Memos API error: HTTP ${response.status}`);
    const data: MemosResponse = await response.json();
    const mdProcessor = await getProcessor();

    const promises = (data.memos || [])
        .filter((memo) => visibility !== "public" || memo.visibility === "PUBLIC")
        .filter((memo) => !tags?.length || tags.some((tag) => memo.tags?.includes(tag)))
        .map(async (memo) => {
            const images: { alt: string; src: string }[] = [];
            const contentWithoutImages = memo.content.replace(
                markdownImagePattern,
                (_match: string, alt: string, src: string) => {
                    images.push({ alt, src });
                    return "";
                },
            );

            if (memo.attachments) {
                for (const att of memo.attachments) {
                    if (att.type?.startsWith("image/")) {
                        if (att.externalLink) {
                            images.push({ alt: att.filename, src: att.externalLink });
                        } else {
                            images.push({
                                alt: att.filename,
                                src: `${baseUrl}/file/${att.name}/${encodeURIComponent(att.filename)}`,
                            });
                        }
                    }
                }
            }

            const rendered = await mdProcessor.render(contentWithoutImages);
            const id = memo.name.split("/").pop() || memo.name;

            return {
                id,
                published: new Date(memo.displayTime || memo.createTime).getTime(),
                html: rendered.code,
                images,
                searchText: (memo.content || "").replace(/[#*`[\]]/g, "").trim(),
            };
        });

    return Promise.all(promises);
}

export async function GET() {
    try {
        if (dynamicConfig.memos?.serverUrl) {
            const data = await fetchFromMemos();
            return new Response(JSON.stringify(data), {
                headers: { "Content-Type": "application/json; charset=utf-8" },
            });
        }
    } catch (error) {
        console.error("Failed to fetch from Memos:", error);
    }
    return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
    });
}
```

### 关键逻辑

- **`GET()` 导出** — Astro 文件路由约定，`export async function GET()` 即为 API 端点
- **baseUrl 清理** — `serverUrl.replace(/\/+$/, "")` 去除尾部斜杠，避免双斜杠
- **Markdown 渲染** — 使用 `@astrojs/markdown-remark` 服务端渲染
- **图片提取** — 同时处理 Markdown 行内图片和附件图片，附件图片构造 `${baseUrl}/file/${name}/${filename}` URL
- **降级** — 任何异常捕获后返回空数组 `[]`

## 四、动态页面集成

在 `src/pages/dynamic/index.astro` 的 frontmatter 中，一行本地集合读取被替换为 Memos 优先的完整逻辑：

```astro title="src/pages/dynamic/index.astro" del={9} ins={10-32}
---
const umamiCfg = analyticsConfig.umamiAnalytics;
const showUmamiViews = !!umamiCfg?.shareId;
const umamiShareId = umamiCfg?.shareId || "";
const umamiApiBase =
	umamiCfg?.shareApiBase ||
	(umamiCfg?.scriptUrl ? new URL(umamiCfg.scriptUrl).origin : "");

const dynamicCount = (await getCollection("dynamic")).length;
// 优先从 Memos 统计动态数，否则回退到本地集合
let dynamicCount = 0;
if (dynamicConfig.memos?.serverUrl) {
    try {
        const svr = dynamicConfig.memos.serverUrl.replace(/\/+$/, "");
        const tok = dynamicConfig.memos.accessToken;
        const headers: Record<string, string> = {};
        if (tok) headers.Authorization = `Bearer ${tok}`;
        const r = await fetch(`${svr}/api/v1/memos?pageSize=1000`, { headers });
        if (r.ok) {
            const d = await r.json();
            const tags = dynamicConfig.memos?.tags;
            dynamicCount = (d.memos || []).filter(
                (m: { visibility: string; tags?: string[] }) =>
                    (dynamicConfig.memos?.visibility !== "public" ||
                        m.visibility === "PUBLIC") &&
                    (!tags?.length || tags.some((t) => m.tags?.includes(t))),
            ).length;
        }
    } catch {}
} else {
    dynamicCount = (await getCollection("dynamic")).length;
}
---
```

`del` 为原来的代码，`ins` 为 Memos 集成后的替换代码。若未配置 Memos 则走 `else` 分支回退到本地集合。

## 五、相关文件

配置：[/src/config/dynamicConfig.ts](https://github.com/olinll/firefly-blog/blob/master/src/config/dynamicConfig.ts)

类型：[/src/types/dynamicConfig.ts](https://github.com/olinll/firefly-blog/blob/master/src/types/dynamicConfig.ts)

API 代理：[/src/pages/api/dynamic.json.ts](https://github.com/olinll/firefly-blog/blob/master/src/pages/api/dynamic.json.ts)

动态页：[/src/pages/dynamic/index.astro](https://github.com/olinll/firefly-blog/blob/master/src/pages/dynamic/index.astro)

相关源码：[olinll/firefly-blog](https://github.com/olinll/firefly-blog)

## 🔗 最后

集成 Memos 后，发布动态的流程变成了：打开 Memos → 写内容 → 打标签 → 发布，博客自动同步。不再需要手动编辑文件再部署，极大提升了发布效率。
