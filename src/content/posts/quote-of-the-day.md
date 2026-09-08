---
title: 'Firefly 魔改：每日一言侧边栏组件'
slug: 'quote-of-the-day'
published: 2026-07-21 19:41:29
updated: 2026-07-22 19:30:00
description: '侧边栏每日一句名言，以日期为种子的伪随机算法确保同一天显示相同内容。'
image: https://img.olinl.com/file/post-img/quote-of-the-day/cover.webp
category: Firefly 二次开发
tags: [Firefly, 博客, 二开, 小部件]
series: Firefly 博客搭建与二次开发
seriesOrder: 11
draft: false
pinned: false
---

在侧边栏展示一句名言，每天刷新。如何做到"同一天显示相同的名言，且不需要数据库"？答案是用日期作为随机种子。

## 一、设计思路

![今日一言效果图](https://img.olinl.com/file/post-img/quote-of-the-day/0001.webp)

名言数据存储在 `content/ziyuan/quote.md` 中，构建时读取。每次页面加载时通过日期字符串计算出伪随机索引，确保：
- **同一天** → 显示同一条名言
- **不同天** → 自动切换
- **无需数据库** → 纯静态，构建时确定

## 二、核心实现

### 日期种子算法

组件完整源码：

```astro title="src/components/widget/QuoteOfTheDay.astro"
---
import { getCollection } from "astro:content";
import WidgetLayout from "@/components/common/WidgetLayout.astro";

interface QuoteItem {
    text: string;
    author: string;
}

interface QuoteData {
    title: string;
    quotes?: QuoteItem[];
}

// 从 content/ziyuan/quote.md 读取名言数据
const ziyuanEntries = await getCollection("ziyuan");
const quoteEntry = ziyuanEntries.find((e) => e.id === "quote");
const quoteData = quoteEntry?.data as QuoteData | undefined;
const quotes = quoteData?.quotes || [];

interface Props {
    class?: string;
    style?: string;
}

const { class: className, style } = Astro.props;

// 使用日期作为随机种子，确保同一天显示相同的名言
const today = new Date();
const dateStr = today.toISOString().split("T")[0];
const seed = dateStr
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
const randomIndex = seed % quotes.length;
const quote = quotes[randomIndex] || { text: "暂无名言", author: "" };
---

<WidgetLayout name="✨ 今日一言" id="quote-of-the-day" class={className} style={style}>
    <div class="quote-content">
        <blockquote class="quote-text">
            <span class="quote-mark">"</span>
            {quote.text}
            <span class="quote-mark">"</span>
        </blockquote>
        <cite class="quote-author">—— {quote.author}</cite>
    </div>
</WidgetLayout>

<style>
    .quote-content { display: flex; flex-direction: column; gap: 0.75rem; padding: 0.5rem 0; }
    .quote-text { position: relative; font-style: italic; font-size: 0.9rem; line-height: 1.6; padding: 0 0.5rem; margin: 0; }
    .quote-mark { font-size: 1.5rem; line-height: 0; vertical-align: middle; color: var(--primary); opacity: 0.6; font-family: Georgia, serif; }
    .quote-author { display: block; text-align: right; font-size: 0.75rem; color: var(--content-meta); font-style: normal; margin-top: 0.25rem; }
    :global(html.dark) .quote-text { color: #fff; }
    :global(.quote-content:hover .quote-text) { color: var(--primary); transition: color 0.2s ease; }
</style>
```

> [!TIP] 为什么会这样工作？
> `toISOString().split("T")[0]` 返回 `"YYYY-MM-DD"` 格式字符串。将其每个字符的 charCode 累加，得到的数字在不同日期不同，同一天完全一致。再取模就得到了"每日固定的随机"索引。

### 数据源

名言存放在资源集合 `src/content/ziyuan/quote.md` 的 frontmatter 中：

```yaml title="src/content/ziyuan/quote.md"
---
title: 名言集
quotes:
  - text: 知行合一
    author: 王阳明
  - text: 学而不思则罔，思而不学则殆
    author: 孔子
---
```

## 三、注册组件

在 `src/components/layout/SideBar.astro` 中导入：

```js title="src/components/layout/SideBar.astro" ins={9}
import Advertisement from "@/components/widget/Advertisement.astro";
import Announcement from "@/components/widget/Announcement.astro";
import Calendar from "@/components/widget/Calendar.astro";
import Categories from "@/components/widget/Categories.astro";
import Dynamic from "@/components/widget/Dynamic.astro";
import GitHubHeatmap from "@/components/widget/GitHubHeatmap.astro";
import Music from "@/components/widget/Music.astro";
import Profile from "@/components/widget/Profile.astro";
import QuoteOfTheDay from "@/components/widget/QuoteOfTheDay.astro";
import Schedule from "@/components/widget/Schedule.astro";
import SidebarTOC from "@/components/widget/SidebarTOC.astro";
import SiteInfo from "@/components/widget/SiteInfo.astro";
import SiteStats from "@/components/widget/SiteStats.astro";
import Tags from "@/components/widget/Tags.astro";
import TimeGreeting from "@/components/widget/TimeGreeting.astro";
```

同时在 `componentMap` 中注册：

```js title="src/components/layout/SideBar.astro" ins={16}
const componentMap = {
    profile: Profile,
    announcement: Announcement,
    categories: Categories,
    tags: Tags,
    sidebarToc: SidebarTOC,
    advertisement: Advertisement,
    stats: SiteStats,
    calendar: Calendar,
    music: Music,
    siteInfo: SiteInfo,
    githubHeatmap: GitHubHeatmap,
    timeGreeting: TimeGreeting,
    dynamic: Dynamic,
    schedule: Schedule,
    quoteOfTheDay: QuoteOfTheDay,
};
```

## 四、注册类型

在 `src/types/sidebarConfig.ts` 的类型联合中添加组件名：

```typescript title="src/types/sidebarConfig.ts" ins={5-6}
export type WidgetComponentType =
    | "githubHeatmap"
    | "timeGreeting"
    | "dynamic"
    | "schedule"
    | "quoteOfTheDay";
```

## 五、配置方式

在 `sidebarConfig.ts` 中配置：

```typescript title="src/config/sidebarConfig.ts"
{
  type: "quoteOfTheDay",
  enable: true,
  position: "top",
  showOnPostPage: false,
}
```

添加新名言只需编辑 `src/content/ziyuan/quote.md` 中的数组即可。

## 六、外部 API 方式（可选）

如果不想维护本地名言库，也可以用客户端脚本在页面加载后实时拉取外部 API。在组件末尾添加 `<script>` 块：

```astro title="src/components/widget/QuoteOfTheDay.astro" ins={1-18}
<script>
  (async () => {
    try {
      const res = await fetch("https://v1.hitokoto.cn/");
      const data = await res.json();
      const text = document.querySelector(".quote-text");
      const author = document.querySelector(".quote-author");
      if (text) text.textContent = `"${data.hitokoto}"`;
      if (author) author.textContent = `—— ${data.from || ""}`;
    } catch {
      // 保留构建时渲染的默认名言
    }
  })();
</script>
```

这样每次页面加载都会从[一言 API](https://hitokoto.cn) 实时获取句子，覆盖组件原本渲染的本地名言。优点是名言库无限大，缺点是无法保持"同一天同内容"的确定性。

如果想保留每日确定性，也可以封装一个服务端 API 代理（类似 `src/pages/api/dynamic.json.ts`），在构建时缓存每日结果。

## 七、相关文件

组件：[/src/components/widget/QuoteOfTheDay.astro](https://github.com/olinll/firefly-blog/blob/master/src/components/widget/QuoteOfTheDay.astro)

数据源：[/src/content/ziyuan/quote.md](https://github.com/olinll/firefly-blog/blob/master/src/content/ziyuan/quote.md)

相关源码：[olinll/firefly-blog](https://github.com/olinll/firefly-blog)

## 🔗 最后

这个组件的巧妙之处在于用最简单的算法实现了"每日刷新"的效果，零运行时依赖。名言数据源和展示逻辑完全分离，你只需要维护名言列表即可。
