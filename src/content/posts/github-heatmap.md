---
title: 'Firefly 魔改：GitHub 贡献热力图侧边栏'
slug: 'github-heatmap'
published: 2026-07-04 13:10:29
updated: 2026-07-22 19:30:00
description: '在侧边栏展示近 100 天的 GitHub 贡献数据，无需 Token 即可拉取。'
image: https://img.olinl.com/file/post-img/github-heatmap/cover.webp
category: Firefly 二次开发
tags: [Firefly, 博客, 二开, GitHub, 小部件]
series: Firefly 博客搭建与二次开发
seriesOrder: 4
draft: false
# pinned: false
---

GitHub 贡献热力图是很多开发者主页的标配，在博客侧边栏放一个，既能展示你的活跃度，也让访客更直观地了解你的开源参与情况。

![GitHub 热力图效果](https://img.olinl.com/file/post-img/github-heatmap/0001.webp)
## 一、组件文件

组件源码位于 `src/components/widget/GitHubHeatmap.astro`，是一个 Astro 服务端渲染组件 + 客户端交互脚本。

使用 [jogruber 公开 API](https://github-contributions-api.jogruber.de/v4/) 拉取数据，无需 Token：

```typescript
const url = `https://github-contributions-api.jogruber.de/v4/${username}?y=last`;
const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
```

服务端 8 秒超时兜底，失败时返回空数据，前端显示降级提示。数据结构：

```typescript
type ContributionDay = {
  date: string;
  count: number;
  level: number;     // 0-4 贡献等级
  tooltip: string;
};

type CalendarData = {
  days: ContributionDay[];
  totalContributions: number;
  activeDays: number;
};
```

按 7 天一列排列网格，每格根据 `level` 设置透明度，颜色取自 `var(--primary)` 跟随主题。

### 完整组件代码

```astro title="src/components/widget/GitHubHeatmap.astro"
---
import { Icon } from "astro-icon/components";
import WidgetLayout from "@/components/common/WidgetLayout.astro";
import { profileConfig } from "@/config";

const githubLink = profileConfig.links.find((item) =>
    /github\.com/i.test(item.url),
);
const githubUsername =
    githubLink?.url.match(/github\.com\/([^/?#]+)/i)?.[1] || "";
const githubProfileUrl = githubUsername
    ? `https://github.com/${githubUsername}`
    : githubLink?.url || "https://github.com";

const HEATMAP_DAYS = 100;

type ContributionDay = {
    date: string;
    count: number;
    level: number;
    tooltip: string;
};

type CalendarData = {
    days: ContributionDay[];
    totalContributions: number;
    activeDays: number;
};

function parseISODate(date: string) {
    return new Date(`${date}T00:00:00.000Z`);
}

function formatISODate(date: Date) {
    return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
}

function formatTooltipDate(date: string) {
    return parseISODate(date).toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
}

// 通过 jogruber 公开 API 服务端拉取 GitHub 贡献数据
// 免费、无需 token、8 秒超时
async function getCalendarData(username: string): Promise<CalendarData> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
            `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
            { signal: controller.signal },
        );
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();

        const today = new Date();
        const endDate = new Date(
            Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
        );
        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - (HEATMAP_DAYS - 1));

        const dayMap = new Map<string, { count: number; level: number }>();
        if (json.contributions && Array.isArray(json.contributions)) {
            for (const entry of json.contributions) {
                dayMap.set(entry.date, {
                    count: entry.count ?? 0,
                    level: entry.level ?? 0,
                });
            }
        }

        const days: ContributionDay[] = [];
        for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
            const date = formatISODate(d);
            const data = dayMap.get(date) || { count: 0, level: 0 };
            days.push({
                date,
                count: data.count,
                level: data.level,
                tooltip:
                    data.count > 0
                        ? `${formatTooltipDate(date)} · ${data.count} 次提交`
                        : `${formatTooltipDate(date)} · 无提交`,
            });
        }

        const totalContributions = days.reduce((s, d) => s + d.count, 0);
        const activeDays = days.filter((d) => d.count > 0).length;

        return { days, totalContributions, activeDays };
    } catch {
        return { days: [], totalContributions: 0, activeDays: 0 };
    }
}

function buildWeeks(days: ContributionDay[]) {
    if (days.length === 0) return [] as Array<Array<ContributionDay | null>>;
    // 按周排列，不足的用 null 占位
    const rangeStart = parseISODate(days[0].date);
    const lastDay = days.at(-1);
    const rangeEnd = parseISODate(lastDay ? lastDay.date : days[0].date);
    const calendarStart = addDays(rangeStart, -rangeStart.getUTCDay());
    const calendarEnd = addDays(rangeEnd, 6 - rangeEnd.getUTCDay());
    const dayMap = new Map(days.map((day) => [day.date, day]));
    const weeks: Array<Array<ContributionDay | null>> = [];

    for (
        let weekStart = calendarStart;
        weekStart <= calendarEnd;
        weekStart = addDays(weekStart, 7)
    ) {
        const week: Array<ContributionDay | null> = [];
        for (let offset = 0; offset < 7; offset++) {
            const current = addDays(weekStart, offset);
            const date = formatISODate(current);
            week.push(
                current < rangeStart || current > rangeEnd
                    ? null
                    : (dayMap.get(date) ?? null),
            );
        }
        weeks.push(week);
    }
    return weeks;
}

export interface Props {
    class?: string;
    style?: string;
}

const { class: className, style } = Astro.props;
const calendarData = await getCalendarData(githubUsername);
const weeks = buildWeeks(calendarData.days);

const opacityLevels = ["0", "0.45", "0.65", "0.85", "1"];
---

<WidgetLayout id="github-heatmap" class={`${className} !overflow-visible`} style={style}>
    {
        githubUsername ? (
            calendarData.days.length > 0 ? (
                <div class="ghc-shell" style={`--week-count: ${weeks.length};`}>
                    <div class="flex items-center justify-between mb-2 text-xs text-neutral-600 dark:text-neutral-400">
                        <a href={githubProfileUrl} target="_blank" rel="noreferrer"
                           class="flex items-center gap-1 font-bold hover:text-(--primary) transition-colors">
                            <Icon name="fa7-brands:github" class="text-sm" />
                            <span>GitHub</span>
                        </a>
                        <span class="font-mono text-[0.7rem] opacity-80">
                            {calendarData.activeDays}/{HEATMAP_DAYS}d
                        </span>
                    </div>

                    <div class="ghc-grid" role="grid">
                        {weeks.map((week) => (
                            <div class="ghc-week" role="row">
                                {week.map((day) =>
                                    day ? (
                                        <div class="ghc-day"
                                             style={day.count === 0
                                                 ? "background-color: var(--btn-plain-bg-hover)"
                                                 : `background-color: var(--primary); opacity: ${opacityLevels[day.level]}`}
                                             data-tooltip={day.tooltip}>
                                        </div>
                                    ) : (
                                        <span class="ghc-placeholder" aria-hidden="true" />
                                    ),
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div class="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                    暂时未获取到 GitHub 提交数据。
                </div>
            )
        ) : (
            <div class="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                请先在个人资料链接中配置 GitHub 主页地址。
            </div>
        )
    }
</WidgetLayout>

<script is:inline>
  (() => {
    const grid = document.getElementById('github-heatmap');
    if (!grid) return;

    let tooltipEl = document.getElementById('ghc-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'ghc-tooltip';
      Object.assign(tooltipEl.style, {
        position: 'fixed', padding: '4px 8px', borderRadius: '6px',
        fontSize: '0.75rem', lineHeight: '1.2', background: 'rgba(0,0,0,0.8)',
        color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        pointerEvents: 'none', opacity: '0', transition: 'opacity 0.15s ease',
        zIndex: '9999', whiteSpace: 'nowrap',
      });
      document.body.appendChild(tooltipEl);
    }

    grid.querySelectorAll('.ghc-day[data-tooltip]').forEach(cell => {
      cell.addEventListener('mouseenter', () => {
        cell.style.boxShadow = '0 0 1px 1.5px var(--primary, oklch(0.55 0.15 250))';
        tooltipEl.textContent = cell.getAttribute('data-tooltip');
        tooltipEl.style.opacity = '1';
        const r = cell.getBoundingClientRect();
        tooltipEl.style.left = r.left + r.width / 2 - tooltipEl.offsetWidth / 2 + 'px';
        tooltipEl.style.top = r.top - tooltipEl.offsetHeight - 6 + 'px';
      });
      cell.addEventListener('mouseleave', () => {
        cell.style.boxShadow = '';
        tooltipEl.style.opacity = '0';
      });
    });
  })();
</script>

<style>
    :global(.ghc-shell) { padding-top: 0.15rem; }
    :global(.ghc-grid) {
        --ghc-gap: 0.25rem;
        display: grid;
        grid-template-columns: repeat(var(--week-count), minmax(0, 1fr));
        column-gap: var(--ghc-gap);
        width: 100%;
    }
    :global(.ghc-week) {
        display: grid;
        grid-template-rows: repeat(7, minmax(0, 1fr));
        row-gap: var(--ghc-gap);
    }
    :global(.ghc-day), :global(.ghc-placeholder) {
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 3px;
    }
    :global(.ghc-day) { cursor: pointer; transition: box-shadow 0.15s ease; }
    :global(.ghc-placeholder) { display: block; opacity: 0; }
</style>
```

## 二、注册组件

新增组件需要在两处注册。

### SideBar.astro 导入

`src/components/layout/SideBar.astro` 的 frontmatter 导入区，按字母顺序与其他 widget 一起引入：

```js title="src/components/layout/SideBar.astro" ins={6}
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
```

### SideBar.astro 组件映射表

`SideBar.astro` 通过 `componentMap` 动态渲染已注册的组件，而 `SideBar` 本身在 `src/layouts/MainGridLayout.astro` 中导入并使用：

```js title="src/layouts/MainGridLayout.astro" ins={5}
import Live2DWidget from "@components/features/Live2DWidget.astro";
import SpineModel from "@components/features/SpineModel.astro";
import Footer from "@components/layout/Footer.astro";
import Navbar from "@components/layout/Navbar.astro";
import SideBar from "@components/layout/SideBar.astro";
import type { MarkdownHeading } from "astro";
import { Icon } from "astro-icon/components";
```

组件渲染链：`MainGridLayout.astro` → `SideBar.astro`（componentMap） → `GitHubHeatmap.astro`

```js title="src/components/layout/SideBar.astro" ins={7}
const componentMap = {
    profile: Profile,
    announcement: Announcement,
    categories: Categories,
    tags: Tags,
    // ...
    githubHeatmap: GitHubHeatmap,
    timeGreeting: TimeGreeting,
    dynamic: Dynamic,
    schedule: Schedule,
    quoteOfTheDay: QuoteOfTheDay,
};
```

`src/components/widget/GitHubHeatmap.astro` — 标题栏颜色适配深浅模式：

```astro title="src/components/widget/GitHubHeatmap.astro" del={1} ins={2}
    <div class="flex items-center justify-between mb-2 text-xs">
    <div class="flex items-center justify-between mb-2 text-xs text-neutral-600 dark:text-neutral-400">
```

## 三、注册类型

在 `src/types/sidebarConfig.ts` 的类型联合中添加组件名：

```typescript title="src/types/sidebarConfig.ts" ins={5}
export type WidgetComponentType =
    | "calendar"
    | "music"
    | "siteInfo"
    | "githubHeatmap"
    | "timeGreeting";
```

## 四、配置启用

在 `src/config/sidebarConfig.ts` 的组件配置数组中添加：

```typescript title="src/config/sidebarConfig.ts"
{
    // 组件类型：GitHub 活跃度热力图
    type: "githubHeatmap",
    // 是否启用该组件
    enable: true,
    // 组件位置
    position: "top",
    // 是否在文章详情页显示
    showOnPostPage: false,
},
```

> [!NOTE] 用户名自动提取
> 组件会自动从 `profileConfig.links` 中匹配 GitHub 链接提取用户名，无需单独填写。

## 五、相关文件

组件：[/src/components/widget/GitHubHeatmap.astro](https://github.com/olinll/firefly-blog/blob/master/src/components/widget/GitHubHeatmap.astro)

侧边栏：[/src/components/layout/SideBar.astro](https://github.com/olinll/firefly-blog/blob/master/src/components/layout/SideBar.astro)

配置：[/src/config/sidebarConfig.ts](https://github.com/olinll/firefly-blog/blob/master/src/config/sidebarConfig.ts)

相关源码：[olinll/firefly-blog](https://github.com/olinll/firefly-blog)

## 🔗 最后

这个组件的实现参考了 [Wine-Red](https://winered-0v0.com) 的思路，数据层使用开源 API，前端渲染与主题色保持统一。
