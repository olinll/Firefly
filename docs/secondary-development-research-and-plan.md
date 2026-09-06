# Firefly 二次开发前期调研与规划

> 调研日期：2026-09-06  
> 调研对象：
>
> - 当前主仓库：`E:\github\Firefly`
> - 参考仓库 A：`E:\github\website-new\fqzlr-bk`
> - 参考仓库 B：`E:\github\website-new\my-blog`

本文档记录本轮对三个仓库的代码、配置、页面、组件、工具、样式、构建脚本和 Git 历史的检查结果。当前阶段只做规划，没有把参考仓库代码直接复制到 Firefly，也没有修改 `src/`、`public/` 或部署配置。

## 1. 基线结论

| 仓库 | 版本/状态 | 代码规模概览 | 主要定位 |
| --- | --- | --- | --- |
| Firefly | `6.16.7`，当前工作区干净 | 121 个组件、27 个页面、27 个配置、48 个工具 | 上游主题基础与成熟通用能力 |
| fqzlr-bk | `6.6.13`，截至 2026-09-05 的个人站点 | 161 个组件、41 个页面、42 个配置、37 个工具、66 个样式文件 | 内容运营、在线编辑、友链巡检、区域访问控制、生活记录 |
| my-blog | `v3.0.1` 附近，最近提交至 2026-09-06 | 92 个组件、27 个页面、23 个配置、61 个工具、57 个样式文件 | 首页体验、文章信息架构、知识图谱、AI 可读接口、交互性能 |

当前 Firefly 已经包含不少两站共有的主题能力，例如文章/归档/分类/标签/搜索/友链/相册/留言/音乐/看板娘/评论系统、MDX、数学公式、Mermaid、PlantUML、Wiki Link、GitHub 卡片、图片优化、Swup 和 Pagefind。因此后续不应按“整站迁移”推进，而应按功能域逐个确认差异、抽取设计意图并适配当前 Firefly 的最新架构。

## 2. 参考仓库 A：fqzlr-bk 的改动画像

### 2.1 页面和内容模型扩展

新增或重构的页面入口包括：

- `/posts/` 独立文章列表及 `/posts/<slug>/` 文章详情；
- `/moments/`、`/moments/pinned/` 说说和置顶说说；
- `/pengyou/` 好友 RSS 聚合；
- `/projects/`、`/calendar/`、`/timeline/`、`/anime/`；
- `/life/notebooks/`、`/life/places/`、`/life/routines/`；
- `/music/`、`/bangumi/` 及番组详情；
- `/write/` 在线写作入口；
- 分类页分层路由 `/categories/<category>/`。

对应配置集中在 `src/config/`：

`bangumiConfig.ts`、`calendarConfig.ts`、`categoryLinks.ts`、`daohangConfig.ts`、`guestbookConfig.ts`、`momentsConfig.ts`、`notebooksConfig.ts`、`pengyouConfig.ts`、`placesConfig.ts`、`projectsConfig.ts`、`relationshipConfig.ts`、`routinesConfig.ts`、`skillsConfig.ts`、`sakuraConfig.ts` 等。内容集合也扩展为 `bangumi`、`life`、`danmu`、`ziyuan` 等目录。

这套方案的特点是“配置和 Markdown/JSON 内容分离”：页面行为由配置开关控制，适合站长持续运营；代价是配置类型、导航、页面开关、内容 schema 和构建脚本之间的耦合明显增加。

### 2.2 在线编辑体系

核心入口和实现：

- `src/pages/write/index.astro`：在线写作入口；
- `src/components/edit/`：`WriteEditor`、`DynamicEditor`、`FriendsEditor`、`MomentsEditor`、`NotebooksEditor`、`PlacesEditor`、`RoutinesEditor`、`SponsorEditor`、`DaohangEditor` 等模块化编辑器；
- `src/utils/editMode.ts`：GitHub App JWT、Installation Token、草稿和提交逻辑；
- `src/pages/api/github.ts`：GitHub API 代理，处理 CORS、请求转发及可选服务端认证；
- `src/config/editConfig.ts`：各模块编辑开关和目标仓库配置；
- `api/github.js`、`src/workers/github-proxy.js`：部署侧代理/认证实现；
- `.pages.yml`：PagesCMS 可视化编辑配置。

认证设计为两种模式：浏览器导入 PEM 私钥并使用 Web Crypto 签发 JWT，或服务端通过环境变量提供认证信息。私钥在浏览器内存或本地存储中的生命周期、GitHub 权限范围、代理的任意路径转发能力，都需要在迁移前重新做安全审计。

### 2.3 友链自动巡检与失效分区

友链体系比当前 Firefly 更完整：

- `src/utils/friend-fail-zones.ts` 将友链按 `fail_count` 分为正常、失效暂留、墓碑三组，并保证互斥；
- `src/components/features/FriendFailWindow.astro`、`FriendFailTombstone.astro` 提供失效友链展示；
- `src/components/features/FriendsMagicPortal.astro`、`FriendsMagicLink.astro` 提供 Three.js 漫游舱和主页截图预览；
- `src/pages/friends.json.ts` 与 `.github/workflows/friend-link-checker.yml`、`cron-check.yml` 组成定期检查、截图和结果发布链路；
- `linkpage`、`siteshot`、`recommended` 等字段进入友链数据模型。

这是一个“数据来源—定时任务—静态资源—页面分区”的完整功能，不应只迁移页面组件而遗漏 GitHub Actions、结果 JSON、截图目录和失效阈值配置。

### 2.4 区域访问控制

最近提交集中于区域屏蔽：

- `src/config/regionBlockConfig.ts` 从 `siteConfig.regionBlock.routes/countryCodes` 派生配置；
- `src/utils/page-toggle-utils.ts` 支持 `PUBLIC_PAGES_*` 环境变量覆盖页面开关；
- 对应区域探测接口返回真实国家码（参考仓库的最近提交已将前端入口隐藏改为按真实 IP 校准）；
- `functions/region.js` 在边缘层读取 GEO 字段，对命中的路径静默 302 回首页；
- 前端通过区域探测结果隐藏导航栏、快速入口、快捷坞、页脚中的受限链接；
- `scripts/sync-region-functions.mjs` 将站点配置同步为部署平台边缘函数。

关键实现意图是“边缘函数做真正拦截，前端隐藏只做体验优化”，不能把 CSS/前端隐藏当成访问控制。区域码字段、路径拼接、静默重定向和静态资源透传都是已在提交历史中修复过的高风险点。

### 2.5 首页与视觉系统

`HomeBlinds` 相关提交经历过多次重构，当前保留的是双层影像揭示、终幕退场钉住、快速导航和双栏聚合等设计方向。新增的首页组件包括 `HomeCompass`、`HomeNotice`、`HomePortal`、`HomeRecent`、`HomeBlinds`、`HomeBlindsScene`、`MobileDock` 等。

样式被拆为 tokens、layout、components、features、vendor 等目录，并额外引入 GSAP、`@vfx-js/core`、Three.js。迁移时应优先移植交互状态机和生命周期处理，再决定是否采用其完整视觉资产；否则容易把大量个人资源与主题能力混在一起。

### 2.6 运营、部署和内容工具

- `.pages.yml` 支持 PagesCMS 内容和媒体库；
- `.github/workflows/` 包含 CI、友链巡检、截图处理；
- `scripts/sync/` 支持 Obsidian/笔记同步；
- `scripts/fetch-media/`、`fetch-music/`、`generate-icons/`、`migrate-bangumi.mjs` 承担资源和内容维护；
- `vercel.json`、`wrangler.jsonc`、`functions/` 同时涉及部署平台与边缘能力。

这些属于站点运营基础设施，建议作为独立阶段评估，避免第一轮功能开发就引入多套部署平台耦合。

## 3. 参考仓库 B：my-blog 的改动画像

### 3.1 首页交互系统

首页由 `src/pages/index.astro` 组合：

`HomeHero` → `HomeTicker` → `HomeDataLayer` → `HomeBlinds` → `HomeMobile` → `HomeSmoothScroll`。

对应工具集中在 `src/utils/home-*`：

- `home-hero-controller.ts`、`home-hero-motion.ts`、`home-hero-dialogue.ts`、`home-hero-sticker.ts`、`home-hero-fly-text.ts`：首屏对话、贴纸、动效和话题交互；
- `home-blinds-controller.ts`：滚动揭示与场景控制；
- `home-data-layer.js`、`home-guide-grid.js`：数据层和导览网格；
- `home-lifecycle.ts`、`home-smooth-scroll.ts`、`home-hero-rain.ts`：生命周期、Lenis 平滑滚动和雨滴效果。

`src/config/homeConfig.ts` 将头像、对话脚本、马赛克布局、雨滴、联系方式、百叶窗场景、图片和滚动距离集中配置，体现了“内容驱动交互”的做法。当前 Firefly 也已有 `HomeBlinds`，后续重点应是比较生命周期、移动端降级、`prefers-reduced-motion` 和 Swup 重复挂载处理，而非直接覆盖首页。

### 3.2 文章列表和文章详情体验

新增 `src/components/pages/article-list/`：`ArticleListPage`、`ArticleList`、`ArticleCard`、`PinnedArticleList`、`ArticlePagination`，配合 `/list/` 与 `/list/<page>/`。

文章页增加：

- `PostHeaderNav.astro`：上一篇/下一篇导航；
- `PostFooterActions.astro`：文章底部操作区；
- `RelatedPosts.astro`：相关文章；
- `ArticleTocPanel.astro`：独立目录面板；
- `article-list-pagination.ts`、`article-toc-tree.ts`、`article-cover-lifecycle.ts`：分页、目录树和封面加载生命周期。

其提交历史明确包含“分页、置顶文章、像素化封面加载、相关闭环、文章上下篇导航”等重构。当前 Firefly 已有基础归档和分页组件，迁移时要先确定信息架构：保留当前首页文章流，还是增加独立 `/list/` 文档入口。

### 3.3 四层知识图谱

my-blog 用知识图谱替换传统分类浏览：

- `src/components/widget/KnowledgeGraph.astro`：图谱容器、首屏 meta、筛选和播放控制；
- `src/components/widget/GraphFilterPanel.astro`：层级、分类、最小文章数、共现关系和搜索过滤；
- `src/utils/knowledge-graph-data.ts`：从内容生成图谱数据；
- `src/utils/graph/`：几何、模拟、渲染、场景、播放、思维导图布局；
- `src/pages/api/knowledge-graph.json.ts`：独立 JSON 端点，带 `max-age=3600` 和 `stale-while-revalidate=86400`；
- `src/pages/categories.astro`：图谱页面入口。

实现上刻意避免把约 74KB 图谱数据内联到 HTML，而是把首帧需要的少量 meta 内联，再通过可缓存 JSON 补齐画布数据。这是当前最值得吸收的性能设计之一，但依赖 D3/自定义模拟、Canvas/WebGL 交互和较复杂的筛选状态，建议单独立项。

### 3.4 LLM Wiki 与内容机器可读接口

`src/utils/llm-wiki.ts` 加上：

- `/wiki/index.json`：Wiki 索引；
- `/wiki/articles/<slug>.md`：单篇 Markdown；
- `/wiki/articles/<slug>.json`：单篇结构化内容；
- `/llms.txt`：面向模型/抓取器的站点摘要入口；
- `src/config/llmsConfig.ts`：开关和描述配置。

`src/pages/wiki/index.json.ts` 使用 `getWikiPosts()` 和 `createWikiIndex()` 生成静态 JSON；知识图谱和 Wiki 都优先从内容集合生成，不维护第二份手工数据。该能力适合作为 SEO、站内知识复用和 AI 工具接入的低风险增量，但需要补充 robots、缓存、草稿/加密文章过滤和隐私边界。

### 3.5 收藏 API 页面

`/collections/` 由 `collectionsApiConfig.ts` 驱动，按分类折叠展示外部工具、AI、开发资源、设计资源等链接，使用 `data-src` 延迟加载图标。页面本身是纯静态外链集合，风险较低；需要注意外链更新、图标来源、链接安全策略和导航命名。

### 3.6 留言板、隐私和用户体验

`GuestbookChat.svelte`、`GuestbookChatComposer.svelte`、`GuestbookChatMessage.svelte`、`guestbook-chat.ts` 对 Waline 做了聊天式封装，支持：

- 回复标记和回复对象展示；
- 表情包 `info.json` 动态加载；
- 图片上传或小图片 Data URL 回退；
- 评论时间、链接、Markdown 图片和文本长度规范化；
- 失败回退界面。

`PrivacyModal.astro`、`UserAgreementModal.astro` 从 `src/content/spec/` 读取隐私政策和用户协议，并通过持久化岛避免 Swup 导航后重复绑定。这里值得吸收的是生命周期和输入规范化；图片上传、评论原文和外部表情资源需要单独做安全审查。

### 3.7 音乐可视化

my-blog 使用 `three`、`AudioAnalyzer`、`ThreeScene`、`VisualizerControls`、`LyricsOverlay` 组成音乐可视化页 `/music/`。`MusicVisualizer.svelte` 连接全站音乐播放器的 `HTMLAudioElement`，通过 Web Audio API 做频谱分析，再驱动 Three.js 场景。

该能力对浏览器自动播放策略、AudioContext 用户手势、`crossOrigin`、GPU 性能和页面离开清理都敏感。my-blog 最近还移除了悬浮歌词并重构播放器，说明这部分仍在快速变化，不建议和第一批基础功能绑定。

### 3.8 生命周期、缓存和可访问性改进

my-blog 的工具中还包含：

- `swup-lifecycle.ts`、`swup-css-prefetch.ts`、`scroll-trigger-refresh.ts`：统一页面生命周期与预取；
- `cache-utils.ts`：浏览器缓存策略；
- `page-loader-controller.js`、`progress-bar.ts`：加载反馈；
- `lazy-collapsible-code-controller.ts`：代码块延迟展开；
- `umami-pageviews.ts`：按页面/文章读取访问量；
- `image-pixel-reveal.ts`：图片像素化揭示；
- `navbar-profile-controller.ts`、`navbar-dropdown-controller.ts`：导航资料卡与下拉交互。

这些改动的共同主题是“Swup 之后仍然正确、首屏不阻塞、可按需加载”。对于当前 Firefly，迁移前应先建立统一的岛生命周期约定，避免每个功能自行监听 `astro:page-load`、`astro:after-swap` 并产生重复监听。

## 4. 当前 Firefly 与两个参考仓库的重叠关系

### 已具备或已有对应基础

- Astro 7、Svelte 5、Tailwind 4、TypeScript、Biome；
- Swup 页面过渡、响应式布局、亮暗主题、动态侧栏；
- 文章详情、归档、分类、标签、搜索、RSS、Sitemap、OG；
- 多种评论系统、图片灯箱、响应式图片、LQIP；
- Mermaid、PlantUML、KaTeX、Callout、代码组、代码折叠、GitHub 卡片；
- 友链、相册、留言、赞助、动态、音乐、Live2D/Spine、樱花和分享海报；
- 当前仓库近期已经有页面开关、元数据、导航毛玻璃、沉浸式目录等更新。

### 当前没有对应实现或差异显著的增量

| 能力 | 主要来源 | 建议 |
| --- | --- | --- |
| GitHub App 在线编辑 | fqzlr-bk | 独立安全评审后再做，优先文章/动态只读预览或 PR 模式 |
| 友链自动巡检、截图、失效墓碑 | fqzlr-bk | 可独立迁移，先定义数据协议和 Actions 输出 |
| 区域边缘拦截 | fqzlr-bk | 只在有明确业务需求时迁移；边缘平台适配不能抽象成纯前端功能 |
| 首页完整百叶窗/数据层 | 两者均有不同版本 | 以当前 Firefly 为基线做局部增强，不直接整套替换 |
| 独立文章列表和上一篇/下一篇 | my-blog | 中优先级，先确定路由与现有归档关系 |
| 四层知识图谱 | my-blog | 单独立项，先验证数据量、移动端性能和无 JS 降级 |
| LLM Wiki、`llms.txt` | my-blog | 低风险，可作为较早的独立增量 |
| `/collections/` 收藏工具页 | my-blog | 低风险，配置驱动即可迁移 |
| 聊天式留言板和隐私弹窗 | my-blog | 在现有评论系统上增量适配，严格处理上传和持久化监听 |
| Three.js 音乐可视化 | my-blog | 低优先级实验功能，和音乐播放器生命周期一起评估 |
| Swup 统一生命周期/缓存/懒加载 | my-blog | 应先抽取为基础设施，再迁移上层交互 |

## 5. 推荐实施顺序

### 阶段 0：确定边界和技术基线

1. 以当前 Firefly `6.16.7` 代码为唯一基线，不从两个旧版本直接合并。
2. 对每个候选功能建立“配置、类型、页面、组件、工具、样式、资源、部署、测试”清单。
3. 先统一 Swup/`astro:page-load` 的初始化和销毁约定。
4. 明确内容集合 schema、草稿/加密文章/隐藏页面的输出规则。

### 阶段 1：低风险、静态和内容增强

- LLM Wiki、`llms.txt` 和文章 Markdown/JSON 接口；
- `/collections/` 收藏工具页；
- 文章上一篇/下一篇、相关文章和文章底部操作区；
- 页面开关与导航自动隐藏的统一约定；
- 隐私政策/用户协议内容入口。

验收重点：构建产物、草稿和加密文章不泄漏、缓存头正确、页面关闭时不生成路由、RSS/OG/Sitemap 不出现错误链接。

### 阶段 2：文章列表与站内发现

- 独立 `/list/` 文章列表；
- 置顶文章、分页、封面渐进加载；
- 归档/分类/标签之间的导航闭环；
- 统一文章列表数据层，避免每个页面重复筛选内容集合。

验收重点：桌面/移动端、无 JS 基本阅读、分页边界、Swup 返回/前进、Pagefind 索引和页面开关。

### 阶段 3：友链运营能力

- 先迁移 `friend-fail-zones.ts` 的纯函数和测试；
- 再定义巡检结果 JSON schema；
- 最后接入 GitHub Actions、截图资源和页面展示。

验收重点：友链不重复分组、尾部斜杠归一化、超时/重定向/证书错误展示、结果缺失时默认正常、截图失败不阻塞整站构建。

### 阶段 4：交互型功能

- 知识图谱；
- 首页高级交互的局部组件；
- 聊天式留言板；
- 音乐可视化。

每个功能都应有 reduced-motion、移动端、低性能设备和页面切换后的清理策略；不要把多个重型交互同时放入同一次发布。

### 阶段 5：高权限和部署耦合能力

- GitHub App 在线编辑；
- 区域边缘拦截；
- PagesCMS、Obsidian 同步和多平台部署脚本。

这一阶段必须增加威胁建模、权限最小化、审计日志、失败回滚和部署平台专项验证。尤其是 GitHub API 代理不能默认允许任意外部 URL、任意方法和宽泛 CORS。

## 6. 迁移时的文件组织建议

参考两个仓库后，建议仍保持当前 Firefly 的分层，不直接复制参考仓库的整个 `src/styles`：

```text
src/
├── config/       # 功能开关和站点数据，保持单一出口
├── types/        # 与 config 一一对应的类型
├── pages/        # 路由和服务端数据端点
├── components/   # Astro 静态壳 + Svelte 交互岛
├── utils/        # 可测试的纯函数、数据转换和生命周期控制器
├── styles/       # 按功能域新增，避免覆盖已有 token
└── content/      # Markdown/MDX 和扩展内容集合
```

建议新增功能采用以下配套最小单元：

1. 一个配置模块和一个类型模块；
2. 一个页面入口或现有页面的明确插槽；
3. 一个数据层/纯函数模块；
4. 一个组件及其样式；
5. 至少覆盖关闭开关、空数据、移动端和 Swup 返回的验证记录。

## 7. 已识别的风险和待确认事项

### 安全风险

- GitHub App 私钥、JWT、Installation Token 和浏览器存储策略；
- GitHub API 代理的任意路径转发、CORS 和服务端 Token；
- 评论图片上传、Markdown 原文、外部表情包和 `{@html}` 渲染；
- LLM Wiki 是否输出隐藏、加密、草稿或包含个人信息的文章；
- 区域限制只能由边缘层执行，前端隐藏不能承担安全责任。

### 性能风险

- 知识图谱的 D3/模拟/Canvas 数据量和移动端 GPU 消耗；
- Three.js 音乐可视化与 Live2D/Spine 同时启用时的资源竞争；
- 首页多段 GSAP/Lenis/Swup 生命周期互相影响；
- 大量图标、截图和图库资源进入 `public` 后对构建、部署和缓存的影响。

### 产品决策

- 文章主入口继续使用当前首页/归档，还是新增 `/list/` 并把“文章”导航指向它；
- 分类页保留传统分类浏览，还是改为知识图谱，或两者并存；
- 是否需要在线编辑，编辑范围是“本地草稿 + PR”还是直推；
- 是否需要区域屏蔽，目标部署平台是 Vercel、Cloudflare 还是其他边缘平台；
- 友链巡检结果由当前仓库 Actions 生成，还是接入外部服务；
- 是否接受首页和音乐可视化带来的额外图片、字体、GPU 和运行时成本。

## 8. 后续开发记录约定

后续每次二次开发都应继续在 `docs/` 下记录：

- 目标和不做的范围；
- 变更文件清单；
- 配置和环境变量；
- 数据 schema 或接口变化；
- 安全、性能、可访问性影响；
- `pnpm check`、`pnpm type-check`、`pnpm build` 及必要的浏览器验证结果；
- 若有视觉改动，附截图或页面验证说明。

本轮结论：优先从 LLM Wiki、收藏页、文章列表体验和可测试的数据层入手；把知识图谱、首页重交互、音乐可视化放在独立迭代；把 GitHub 在线编辑和区域边缘拦截作为经过安全/部署评审后的专项工程。

## 9. 访问数量

### 9.1 目标

从 `E:\github\website\firefly-blog` 迁移 Umami Share API 的前端展示能力，将访问数量展示到以下页面和组件：

| 位置 | 统计路径 | 展示位置 |
| --- | --- | --- |
| 首页文章列表 | `/posts/<slug>/` | 每篇文章卡片的元信息 |
| 文章详情页 | 当前文章路径 | 文章元信息 |
| 友链页面 | `/friends/` | 页面标题区域 |
| 留言板页面 | `/guestbook/` | 页面标题区域 |
| 动态页面 | `/dynamic/` | 动态封面顶部统计徽章 |

### 9.2 数据请求流程

统一组件为 `src/components/analytics/UmamiPageViews.astro`，页面只需要传入统计路径：

1. 从 `analyticsConfig.umamiAnalytics.shareId` 和 `shareApiBase` 读取公开分享配置；
2. 请求 `${shareApiBase}/api/share/${shareId}`，取得 Umami 的公开 token 和 `websiteId`；
3. 使用 token 请求 `/api/websites/<websiteId>/metrics`；
4. 指定 `type=path`，获取全站 URL 路径访问量；
5. 去掉路径末尾多余的 `/` 并统一小写；
6. 对相同路径的指标行累加 `y` 值；
7. 将结果写入带有 `data-umami-pv-value` 的 DOM 节点。

### 9.3 缓存、超时和失败处理

- Share token 使用 LocalStorage 缓存 24 小时；
- 网站路径指标缓存 5 分钟；
- 每次请求设置 8 秒超时，避免页面长期停留在“加载中”；
- 请求失败、跨域失败或 Umami 暂时不可用时显示 `—`；
- 访问量请求失败不会阻塞文章、友链、留言板或动态内容；
- 支持 `swup:contentReplaced` 和 `astro:page-load`，站内无刷新切换页面后会重新填充；
- 使用全局初始化标记，避免 Swup 多次进入页面时重复绑定监听器。

### 9.4 文章页的特殊处理

此前文章元信息中的旧评论系统 PV 节点可能一直显示“浏览量加载中”。现在配置 Umami Share 后，`PostMeta.astro` 优先使用统一 Umami 统计，并隐藏旧 PV 节点，避免重复显示或旧脚本卡住。首页 `PostCard.astro` 负责将文章 id 传入元信息组件，文章详情页则使用当前页面路径。

### 9.5 涉及文件和配置

- `src/components/analytics/UmamiPageViews.astro`：展示结构、API、缓存、超时和页面切换逻辑；
- `src/types/analyticsConfig.ts`：增加 `shareId`、`shareApiBase` 类型；
- `src/config/analyticsConfig.ts`：配置公开 Share ID 和 Umami API 地址；
- `src/components/layout/PostCard.astro`、`PostMeta.astro`：文章访问量；
- `src/pages/friends.astro`、`guestbook.astro`、`dynamic/index.astro`：页面访问量；
- `src/config/analyticsConfig.ts` 中的其他 analytics 参数与 `firefly-blog` 保持一致，可直接同步。

注意：`shareId` 是 Umami 的公开分享标识，不等同于管理密钥。更换 Umami 实例时只需修改 `shareId` 和 `shareApiBase`，并确认 Share API 允许跨域读取。

## 10. 动态页面修改

### 10.1 页面目标

参考 `E:\github\website\firefly-blog` 的动态页，将当前 `/dynamic/` 从传统标题栏改为封面式布局，主要视觉结构为：

- 大尺寸横向封面图；
- 左上角动态标题和描述；
- 右上角访问数量和动态数量徽章；
- 左下角搜索框和年份筛选器；
- 右下角头像重叠在封面与信息栏之间；
- 信息栏显示个人签名；
- 封面下方继续渲染已有动态列表。

### 10.2 数据流和数量统计

`src/pages/dynamic/index.astro` 负责页面级数据准备：

- 检查 `siteConfig.pages.dynamic`，关闭时跳转 404；
- 根据 `dynamicConfig` 读取标题、描述、数据地址、每页数量和评论开关；
- Memos 模式下请求 `${memos.apiUrl}/api/v1/memos?pageSize=1000`；
- 只统计 `state === "NORMAL"` 的 Memos，避免草稿或已删除数据进入数量；
- 非 Memos 模式下回退为 `getCollection("dynamic")` 的本地内容数量；
- `DynamicFeed.svelte` 仍负责客户端加载、分页、搜索和年份筛选。

### 10.3 封面组件和配置

新增 `src/components/pages/dynamic/DynamicCover.astro`，封装封面相关 DOM 和样式。新增配置：

```ts
cover: {
  enable: true,
  image: "/assets/images/dynamic-cover.jpg",
  greeting: "Hello 顾拾柒",
}
```

类型定义同步位于 `src/types/dynamicConfig.ts`。当 `cover.enable` 为 `false` 时，页面仍保留原来的标题、数量和筛选器结构作为兼容回退。

### 10.4 图片资源

参考站配置原本使用远程图片地址。为避免生产环境依赖外部图片，本次将封面保存为：

- `public/assets/images/dynamic-cover.jpg`：动态页横向封面；
- `src/constants/lqips.json`：由构建脚本生成的封面低清占位信息。

封面使用 `loading="eager"`，首屏优先加载；头像继续使用 `profileConfig.avatar`，签名继续使用 `profileConfig.bio`。

### 10.5 响应式和交互

- 桌面端封面高度约 280px；
- 移动端封面高度约 240px；
- 移动端顶部信息自动纵向排列；
- 搜索框和年份选择器使用半透明圆角胶囊样式；
- 封面图片悬停时轻微放大；
- 搜索和年份控件沿用现有 `DynamicFeed` 的 `data-dynamic-search`、`data-year-select` 选择器，因此没有重复实现筛选逻辑；
- 访问数量通过 `UmamiPageViews.astro` 的 `cover` 变体显示，并继承缓存、超时和 Swup 处理。

### 10.6 涉及文件

- `src/components/pages/dynamic/DynamicCover.astro`：封面布局和响应式样式；
- `src/pages/dynamic/index.astro`：封面开关、动态数量和组件组装；
- `src/config/dynamicConfig.ts`、`src/types/dynamicConfig.ts`：封面配置及类型；
- `src/components/analytics/UmamiPageViews.astro`：新增 `cover` 展示变体；
- `public/assets/images/dynamic-cover.jpg`：本地封面图片；
- `src/constants/lqips.json`：构建生成的低清占位条目。

## 11. 鼠标图标修改

### 11.1 资源来源

鼠标图标从 `E:\github\website\firefly-blog\public\mouse` 复制到当前仓库：

- `public/mouse/default.cur`：普通页面状态；
- `public/mouse/pointer.cur`：链接、按钮等可点击元素状态。

两个文件均为 4286 字节，并已通过 SHA-256 校验，与参考仓库对应文件一致。

### 11.2 样式规则

新增 `src/styles/mouse.css`，定义两个 CSS 变量：

```css
:root {
  --cursor-default: url("/mouse/default.cur"), default;
  --cursor-pointer: url("/mouse/pointer.cur"), pointer;
}
```

应用范围：

- `html`、`body` 默认使用 `default.cur`；
- `a`、`button`、`select`、`label`、表单提交按钮和 `[role="button"]` 使用 `pointer.cur`；
- `input`、`textarea`、`[contenteditable="true"]` 恢复文本输入光标；
- `.cursor-pointer` 继续支持手动指定指针状态。

### 11.3 全局接入

在 `src/layouts/Layout.astro` 中引入 `@/styles/mouse.css`，因此所有页面都继承相同鼠标行为，包括首页、文章、动态、友链和留言板，无需在各页面重复引入。

### 11.4 兼容性说明

- `.cur` 文件无法加载时，CSS 会回退到浏览器默认 `default` 或 `pointer`；
- 输入区域不会错误显示点击指针，保持文本编辑体验；
- 这是桌面端视觉增强，触摸设备没有鼠标指针，不影响移动端布局和交互；
- 不改变链接跳转、按钮点击和键盘焦点行为。

## 12. 本轮综合验证

- `pnpm exec biome check --write ...`：通过；
- `pnpm check`：0 errors、0 warnings、0 hints；
- `pnpm type-check`：通过；
- `git diff --check`：通过；
- 动态页本地渲染：封面图片、访问数量、动态数量、头像、签名均显示；
- 动态页交互：搜索和年份筛选均验证生效；
- `pnpm build`：代码构建阶段通过，但最终 OG 图片渲染因外部 `fonts.gstatic.com` 连接超时失败，该问题属于外部网络依赖，不是本轮页面代码错误；
- 本地浏览器验证时曾出现 Vite `@swup_astro_client_Swup.js` 动态模块加载错误，页面主体仍可渲染和交互，需在后续清理开发缓存或检查本地 Vite 依赖缓存。

## 13. `website-new/my-blog` 友链页实现分析（2026-09-06）

### 12.1 页面入口与渲染流程

入口为 `E:\github\website-new\my-blog\src\pages\friends.astro`，页面流程如下：

1. 检查 `siteConfig.pages.friends`，关闭时跳转 404；
2. 读取 `friendsPageConfig` 和 `getEnabledFriends()`；
3. 按每个友链的 `tags` 分组，无标签归入“未分类”；
4. 按分组名称排序，渲染可折叠的手风琴分组；
5. 每个友链交给 `FriendCard.astro` 渲染；
6. 页面底部交给 `FriendChat.astro` 渲染对话气泡、申请规则、本站信息和复制按钮；
7. 根据评论配置决定是否渲染友链页评论区；
8. 页面脚本通过 `definePageIsland` 接入 Swup 生命周期，负责手风琴、头像失败回退、封面加载动画、鼠标悬停大图预览和申请区打字机动画。

### 12.2 数据和配置模型

友链数据集中在 `src/config/friendsConfig.ts`：

- `title`：友链名称；
- `imgurl`：圆形头像地址；
- `desc`：简介；
- `siteurl`：外链地址；
- `image`：可选的卡片横向封面；
- `tags`：分组标签数组；
- `weight`：非随机模式下的排序权重；
- `enabled`：是否展示。

页面配置 `friendsPageConfig` 还包括标题、描述、评论开关、随机排序、申请链接、本站信息、注意事项和对话消息。参考站把申请区所需的数据全部放进配置，而不是写死在页面结构中。

### 12.3 友链卡片

`FriendCard.astro` 使用一个外链 `<a>` 作为整张卡片：

- 有 `image` 时，上方显示横向封面；没有时省略封面，卡片自动变紧凑；
- 封面加载时显示四球滚动 loader，加载完成后使用像素揭示动画；
- 头像加载失败后显示站点名称首字母；
- 主体显示圆形头像、名称、解析后的域名和简介；
- 鼠标悬停或键盘聚焦时显示外链箭头；
- 桌面精确指针设备悬停卡片时，页面右侧浮出完整封面预览。

### 12.4 样式和交互

专用样式位于 `src/styles/pages/friends.css`，主要包括：

- 标签分组手风琴：使用 `grid-template-rows: 0fr/1fr` 做高度过渡，不依赖测量高度；
- 响应式网格：桌面 3 列、中等屏幕 2 列、移动端 1 列；
- 卡片封面、头像失败回退和悬停预览；
- 友链申请区双栏布局，移动端变单栏；
- 对话气泡逐个弹出和文字逐字显示；
- `prefers-reduced-motion: reduce` 下关闭主要动画。

### 12.5 与当前 Firefly 的差异

当前 `E:\github\Firefly\src\pages\friends.astro` 已有：

- `friendsConfig` / `getEnabledFriends()` 数据读取和权重排序；
- 搜索框和标签筛选；
- 外链卡片、头像、简介、标签和访问统计；
- `friends.mdx` 自定义内容和评论区。

当前缺少参考站的主要能力：

- `FriendCard.astro` 独立组件和横向封面字段 `image`；
- 按标签分组的手风琴展示；
- 独立的 `FriendChat.astro` 对话与申请说明组件；
- 配置化的申请链接、本站信息、注意事项和 chat 数据；
- 头像失败首字母回退、封面加载动画和悬停大图预览；
- 统一的 `friends.css` 页面专用样式与 Swup 页面岛初始化。

### 12.6 后续迁移建议

如果要完全做成 `my-blog` 的样式，建议按以下顺序拆分迁移：

1. 先扩展当前 `friendsConfig` 和 `friendsConfig` 类型，增加 `image`、`applyLink`、`siteInfo`、`notes`、`chat`；
2. 新增 `FriendCard.astro`，保留当前友链数据和 Umami 页面访问量；
3. 新增 `FriendChat.astro`，将当前 `friends.mdx` 中的本站信息和申请规则逐步移入配置；
4. 新增或重写 `src/styles/pages/friends.css`，迁移手风琴、三列卡片和移动端规则；
5. 最后改造 `friends.astro` 的分组和 Swup 生命周期脚本，并验证搜索、标签筛选、折叠、外链打开、图片失败和移动端布局。

参考站的友链图片资源位于 `E:\github\website-new\my-blog\public\assets\images\friends`，共包含多张 `.webp` 卡片封面；如果同步友链数据，还需要同步这些资源并检查配置中的路径。

## 14. blog-v3 友链页面迁移记录（2026-09-06）

本轮按用户提供的 `E:\github\website-new\blog-v3` `/link` 页面进行迁移，目标是将当前 Firefly 的友链页改成“分组标题 + 友链头像列表 + 悬浮详情”的形式，同时保留当前项目的友链页访问统计、下方自定义内容和评论区。

### 14.1 参考实现

参考页面是 Nuxt 页面 `E:\github\website-new\blog-v3\app\pages\link.vue`，核心组件和数据文件如下：

- `app/pages/link.vue`：页面入口、SEO、本站信息复制区、申请友链内容和评论区；
- `app/components/content/FeedGroup.vue`：分组标题、分组描述、网格列表和可选随机排序；
- `app/components/content/FeedCard.vue`：友链头像卡片和悬浮详情；
- `app/types/feed.ts`：友链数据类型；
- `app/feeds.ts`：三组友链数据及 RSS / Atom 地址；
- `app/app.config.ts`：`randomInGroup` 等友链页面选项。

当前 Firefly 是 Astro，因此没有直接复制 Vue 组件，而是按照同样的数据模型和视觉层级重写为 Astro 组件。

### 14.2 已迁移的数据

新增 `src/config/friendsFeedConfig.ts`，完整迁移 `blog-v3/app/feeds.ts` 中的友链数据：

- `关于本站`：4 条；
- `相谈甚多`：6 条；
- `网上邻居`：29 条；
- 合计 39 条友链，其中 27 条带有 RSS / Atom 源地址。

每条数据保留以下字段：

- `author`：博主名称；
- `sitenick`：站点昵称，可选；
- `title`：站点标题；
- `desc`：站点简介；
- `link`：站点地址；
- `feed`：RSS / Atom 订阅源，可选；
- `icon`：站点图标；
- `avatar`：友链列表头像；
- `archs`：技术栈或部署平台；
- `date`：收录日期；
- `comment`：友链备注，可选。

新增 `src/types/friendsFeed.ts` 对上述字段进行类型约束。现有 `src/config/friendsConfig.ts` 会把分组数据扁平化为旧版 `FriendLink[]`，继续为其他旧组件提供兼容数据，同时给每条友链保留所属分组标签和排序权重。

### 14.3 当前页面实现

`src/pages/friends.astro` 现在按 `friendsFeedGroups` 顺序渲染分组：

1. 页面顶部显示友链标题、描述和 Umami 访问数量；
2. 每组显示大号描边标题、分组描述和响应式友链网格；
3. 友链主体显示圆形头像、作者名和站点昵称；
4. 鼠标悬浮或键盘聚焦时显示站点图标、域名、技术栈、收录日期、简介和备注；
5. 有 `feed` 的友链在详情中显示 RSS / Atom 入口；
6. 保留 `friends.mdx` 自定义内容和评论区，避免覆盖当前已有的申请友链说明；
7. 外链使用新窗口打开，并添加 `noopener noreferrer`。

新增组件：

- `src/components/pages/friends/FriendFeedGroup.astro`：分组容器和友链列表；
- `src/components/pages/friends/FriendFeedCard.astro`：头像卡片、详情浮层和 RSS / Atom 链接。

新增 `src/styles/friends.css`，实现参考页面的主要视觉规则：大号半透明描边分组标题、自动填充网格、圆形头像、悬浮抬升、详情浮层、移动端纵向卡片和减少动画模式。`src/config/index.ts` 同步导出 `friendsFeedGroups`，方便页面及其他组件统一读取。

### 14.4 兼容性和边界处理

- 旧版 `FriendLink` 的 `title`、`imgurl`、`desc`、`siteurl`、`tags`、`weight`、`enabled` 字段继续生成；
- `title` 缺失时按 `sitenick`、`author` 顺序回退；
- `desc` 和 `comment` 缺失时不渲染空行；
- `feed` 缺失时不显示 RSS / Atom 入口；
- 域名解析失败时保留原始链接文本；
- 头像和站点图标使用懒加载与异步解码；
- `friendsPageConfig.showCustomContent` 和 `showComment` 仍然有效；
- 当前页面保留已有访问统计，路径固定为 `/friends/`。

### 14.5 本轮验证

- `pnpm exec biome check --write`：通过；
- `pnpm check`：通过，0 errors / 0 warnings / 0 hints；
- `pnpm type-check`：通过；
- `git diff --check`：通过；
- 本地页面 `http://localhost:4321/friends/`：成功渲染，页面标题、访问量、3 个分组、39 条友链和带 RSS / Atom 的详情入口均出现在可访问性树中；
- 视觉验证：已通过 Codex in-app browser 打开友链页检查实际渲染结果。

## 15. 友链详情浮层被侧边栏遮挡修复（2026-09-06）

### 15.1 问题现象

友链卡片的详情浮层使用绝对定位，部分卡片位于友链网格边缘。当浮层向卡片外侧展开时，页面主体容器的 `overflow: hidden` 会直接裁掉浮层；被裁掉的区域看起来像是被左右侧边栏遮挡，RSS / Atom 信息也可能只显示一部分。

### 15.2 修复内容

在 `src/styles/friends.css` 的 `.friends-feed-page` 中：

- 增加 `position: relative`，让友链页成为浮层的稳定定位上下文；
- 增加局部 `z-index`，让详情浮层在页面主体层级中正常显示；
- 将 `overflow: hidden` 改为 `overflow: visible`，允许边缘卡片的详情浮层突破友链页卡片边界；
- 保留浮层自身的 `z-index: 30`，避免详情内容被同级友链元素覆盖。

修复后重新打开 `/friends/` 页面，友链数量、分组内容和 RSS / Atom 入口均正常渲染；`pnpm check`、`pnpm type-check` 和 `git diff --check` 通过。

## 16. 友链浮层定位再次修复（2026-09-06）

前一次仅解除容器裁剪仍不够：绝对定位浮层会继承友链网格边缘的坐标，可能伸入左右侧栏；同时使用 `.friend-feed-item:hover` 作为打开条件时，鼠标经过浮层或邻近区域也可能造成误弹。

本次改为在 `FriendFeedGroup.astro` 中使用事件委托：

- 只响应具体 `.friend-feed-card` 的 `pointerover` 和键盘 `focusin`；
- 鼠标离开该友链项或焦点移出该友链项时关闭；
- 同一时间只保留一个打开的详情浮层；
- 页面滚动或窗口尺寸变化时重新计算位置；
- 通过 `data-tooltip-open` 控制显示状态，不再使用泛化的 `.friend-feed-item:hover`。

浮层 CSS 改为 `position: fixed`，脚本根据卡片的 `getBoundingClientRect()` 计算视口坐标：优先显示在卡片上方，顶部空间不足时自动切到下方，并将左右坐标限制在视口内。浮层层级调整为 `z-index: 1000`，因此不会被左右侧栏的 sticky 内容覆盖；RSS / Atom 链接仍然可以点击。

本次修复已重新通过 `pnpm check`、`pnpm type-check` 和 `git diff --check`。

## 17. 友链浮层定位偏移修复（2026-09-06）

上一次将详情浮层改为 `position: fixed` 后，仍出现浮层跑到错误友链附近的问题。原因是 `.friend-feed-item` 的入场动画同时使用了 `transform`。带有 `transform` 的祖先元素会成为 fixed 子元素的 containing block，导致浮层实际相对于某个友链项定位，而不是相对于浏览器视口定位。

本次将 `friend-feed-float-in` 动画改为只过渡 `opacity`，移除 `transform: translateY(...)`。这样详情浮层可以真正依据卡片的视口坐标定位，同时保留淡入效果，不会再因为入场动画改变 fixed 定位参照物。

## 18. 友链浮层脱离布局容器定位（2026-09-06）

如果仅依靠 `position: fixed`，某些带有容器查询、变换或其他布局隔离属性的祖先仍可能影响 fixed 元素的 containing block。为彻底解决截图中浮层与实际悬浮卡片错位的问题，本次在打开详情时将 `.friend-feed-tooltip` 临时移动到 `document.body`，然后再根据目标卡片的视口矩形计算位置。

当前定位流程为：

1. 具体友链卡片触发 `pointerover` 或 `focusin`；
2. 关闭上一个浮层，并把当前浮层提升到 `body`；
3. 读取卡片和浮层尺寸，计算水平居中位置；
4. 浮层优先显示在卡片上方，空间不足时显示在下方；
5. 将坐标限制在视口内，并在滚动、缩放时重新计算；
6. 关闭时将浮层放回原来的友链项，页面切换前同步清理。

这样浮层不再受友链网格、`container-type`、动画或左右侧栏定位上下文影响。

## 19. 防止友链浮层未定位时出现在左上角（2026-09-06）

发现浮层提升到 `body` 后，如果浏览器先应用了 `top: 0; left: 0`，而下一帧的位置计算尚未完成，就会短暂或持续显示在页面左上角。为避免任何未计算坐标的浮层可见，本次新增 `data-tooltip-positioned` 状态：

- 打开浮层时先移除该状态，浮层保持隐藏；
- 完成卡片坐标、浮层尺寸和视口边界计算后再写入该状态；
- CSS 只有同时存在 `data-tooltip-visible` 和 `data-tooltip-positioned` 时才显示；
- 关闭时清理两个状态，避免页面切换或热更新残留。

因此即使脚本尚未完成定位，也不会再看到左上角的默认浮层。

## 20. 对照 blog-v3 重做浮层触发机制（2026-09-06）

重新检查 `E:\github\website-new\blog-v3\app\components\content\FeedCard.vue` 后确认，参考实现并不是手写 `li:hover` 浮层，而是使用 `vue-tippy` 注册的 `Tooltip` 组件：

- `FeedCard` 将卡片作为 Tooltip 的触发元素；
- 详情内容通过 `#content` 插槽交给 Tippy 管理；
- 设置 `interactive`，允许鼠标从卡片移动到详情框；
- Tippy 会将气泡挂载到组件父级并自行计算 placement、边界和箭头位置；
- `FeedGroup.vue` 额外将移动动画节点设置为 `contain: paint` 和 `pointer-events: none`，防止排序动画节点干扰气泡触发。

当前 Firefly 没有 `vue-tippy` 运行时，因此在 Astro 中按相同原则实现：详情框通过脚本挂载到 `document.body`，卡片使用直接绑定的 `mouseenter` / `mouseleave` / `focus` / `blur` 事件，坐标使用 `getBoundingClientRect()` 计算，避免事件委托在相邻卡片和浮层之间误判。浮层只有在坐标计算完成后才显示，并在 Swup 页面切换时恢复到原友链项。

## 21. 友链浮层延迟与可交互行为（2026-09-06）

参照 `blog-v3` `FeedCard.vue` 的 `<Tooltip :delay="200" interactive>`，当前 Astro 实现补齐了相同交互：

- 鼠标或键盘焦点进入卡片后延迟 200ms 打开；
- 从卡片移动到浮层时保持打开；
- 浮层本身启用鼠标事件，RSS / Atom 链接可以操作；
- 鼠标离开卡片和浮层整体后延迟 80ms 关闭，避免移动过程中的误关闭；
- 进入新的卡片时取消旧定时器并重新计时；
- 页面切换、滚动和缩放仍会清理或重新定位当前浮层。

## 22. 友链卡片悬浮边框样式（2026-09-06）

根据参考图和 `blog-v3` 的 `FeedCard` 悬浮效果，友链卡片采用圆角矩形样式。`src/styles/friends.css` 中 `.friend-feed-card` 使用 `0.75rem` 圆角和透明占位边框，悬浮或键盘聚焦时显示青色边框与淡蓝色背景；头像保持圆形，详情浮层继续显示在卡片上方并保留圆角。

## 23. 友链默认头像（2026-09-06）

友链数据中的头像和站点图标多数来自外部站点，存在地址失效、跨域图片不可用或临时网络错误的情况。`FriendFeedCard.astro` 现在为头像和站点图标提供统一的首字符回退：

- 数据字段为空时直接显示首字符头像；
- 图片加载失败时由统一脚本隐藏破图并显示首字符头像；
- 列表头像和详情浮层中的站点图标都具备回退逻辑；
- 回退头像不依赖外部资源，不会产生破图或额外网络请求。

## 25. 友链头像回退脚本初始化时机修复（2026-09-06）

发现首字符回退没有生效的原因是 `FriendFeedGroup.astro` 的 Astro 脚本可能在友链卡片 DOM 完成前执行，首次 `querySelectorAll()` 找不到卡片，导致头像 `error` 事件和 hover 事件都没有绑定。

现在脚本会根据文档状态处理初始化：文档仍在加载时监听 `DOMContentLoaded`，文档已完成时使用下一帧绑定；同时继续监听 `astro:page-load`，确保 Swup 页面切换后新卡片也会重新绑定。这样远程头像加载失败后会正确隐藏破图并显示作者首字符。

## 24. 友链首字符头像回退（2026-09-06）

根据最新视觉要求，默认头像不再使用固定图片，而是使用文字头像：从 `author` 取第一个字符，作者名为空时回退到站点标题的第一个字符。中文显示第一个汉字，英文显示首字母并转为大写。

- 有效远程头像正常显示；
- 头像地址为空时直接显示首字符圆形头像；
- 头像加载失败时隐藏破图并显示首字符圆形头像；
- 详情浮层中的站点图标也使用相同首字符回退；
- 首字符头像使用主题主色和淡色背景，保持与当前卡片风格一致。

## 26. 修复外层友链卡片破图显示（2026-09-06）

验证页面后发现，详情浮层中的首字符已经正常，但外层卡片仍可能显示浏览器破图和图片 `alt` 文本。原因是外层图片没有进入原有的失败图片绑定范围，而且部分懒加载图片在脚本初始化后才变为失败状态。

本次处理为：

- 外层 `.friend-feed-avatar` 的图片和详情浮层图片分别绑定；
- 对初始化时已经失败、延迟失败以及缓存失败的图片进行状态同步；
- 外层头像默认先显示作者首字符，图片成功加载后再通过 `is-loaded` 淡入覆盖；
- 失败图片保持透明或隐藏，避免出现破图图标和 `alt` 文本；
- 无头像数据的条目直接使用作者首字符，不再把 fallback 错误隐藏。

这样外层卡片和详情浮层的默认头像行为一致，失效头像不会破坏友链列表布局。

## 27. 友链列表间距对齐 blog-v3（2026-09-06）

对照 `E:\github\website-new\blog-v3\app\components\content\FeedGroup.vue` 和 `FeedCard.vue` 后，将当前友链列表恢复为参考项目的实际间距：

- 分组使用 `margin: 2em 1em`；
- 网格使用 `gap: 0.2em 0.5em`，列表使用 `margin: 1em auto`；
- 卡片由分组样式覆盖为 `width: auto; margin: 0`，填充所在网格列；
- 卡片内边距恢复为 `0.5em`；
- 分组标题补齐 `position: sticky; top: 0`，与参考实现一致。

## 28. 更新友链申请模板（2026-09-06）

将友链页面的本站信息和可复制申请模板更新为当前站点资料：

- 作者：顾拾柒；
- 站点标题：Olinl Blog；
- 描述：分享、实践、学习；
- 链接：`https://blog.olinl.com/`；
- Feed：`https://blog.olinl.com/atom.xml`；
- 图标和头像：QQ 头像地址；
- 技术标签：Astro、EdgeOne。

申请区现在直接展示并复制完整 YAML 友链配置，方便其他站点提交申请。

## 29. 补全友链申请信息字段（2026-09-06）

友链页面左侧可复制信息区已与申请 YAML 字段保持一致，新增并展示：作者、站点名称、站点描述、站点链接、订阅地址、图标地址、头像链接和技术栈。这样申请者可以逐项复制，也可以使用右侧完整 YAML 模板。

## 30. 修复友链申请栏窄屏溢出（2026-09-06）

当内容区宽度较小时，申请栏中的长邮箱、订阅地址和 YAML 模板会因为不换行把右侧内容撑出容器。现在两栏子容器增加 `min-w-0`，邮箱使用断词换行，YAML 模板使用 `whitespace-pre-wrap` 与 `break-all`，确保双栏布局在窄屏下仍保持在页面范围内。

## 31. 归档页对齐 blog.bsgun.cn 时间线效果（2026-09-06）

归档页开始按 `https://blog.bsgun.cn/archive` 的视觉和交互重构：

- 年份使用时间线标题、节点和文章数量/字数统计；
- 文章行显示日期、虚线时间线、分类、标题和标签；
- 悬停或键盘聚焦时，日期显现、时间线节点拉伸、标题向右平移并变为主题色；
- 文章封面默认作为右侧渐变背景，悬停时扩展宽度并提高透明度；
- 没有设置文章图片时，使用 `coverImageConfig.randomCoverImage` 的随机图 API，并以文章 ID 作为种子；
- 保留当前归档的年份折叠、分类筛选、标签筛选和未分类筛选逻辑；
- 归档页使用完整文章条目以解析本地封面路径，同时保证筛选数据结构不变。

## 32. 修复归档封面悬停放大未命中（2026-09-06）

归档页初版的封面基础样式可以显示图片，但悬停时的扩展规则没有生效。原因是 `ArchivePanel.astro` 的 scoped CSS 为悬停选择器自动附加了父组件作用域，而 `CoverImage.astro` 输出的封面根节点属于子组件作用域，二者无法匹配。

已将悬停和键盘聚焦选择器改为跨组件匹配。现在封面会按照 blog-v3 的效果从默认最多 `180px` 扩展到文章区域的 `50%`，同时透明度提升、裁剪位置变化，标题平移和时间线节点动画保持同步。

## 33. 归档封面改为中心缩放（2026-09-06）

用户反馈封面展开后缺少图片缩放感，且图片被 `CoverImage` 组件的 `150px` 最小高度顶端对齐。本次将归档封面容器的高度强制限制为文章行高度，并把缩放动画应用到封面内部图片：

- 图片以中心点为基准保持 `object-position: center`；
- 悬停或键盘聚焦时内部图片执行 `scale(1.12)`；
- 容器继续从 `180px` 展开到 `50%`，并裁剪溢出部分；
- 覆盖 `CoverImage` 默认最小高度，避免封面撑高文章行或贴顶显示。

## 34. 修复归档暗色模式文字对比度（2026-09-06）

归档重构后文章行沿用了 `--deep-text`，但该变量在暗色模式下仍是深色值，导致日期和文章标题几乎不可见。现在归档文章、日期和标题改用主题自适应的 `--content-meta`，悬停时仍切换为 `--primary`，确保亮色和暗色模式都有足够对比度。

## 35. 调整归档文章行的标签与图片顺序（2026-09-06）

按照视觉要求，归档文章行现在固定为“日期 → 时间线 → 标题 → 标签 → 图片”的顺序。图片从标题区域移到行末，桌面端使用 `180px` 宽度，移动端使用 `7rem` 宽度；悬停时图片以右侧中心为基准放大 `1.12` 倍，标签不会被图片遮挡。封面高度固定为文章行高度，避免 `CoverImage` 的默认最小高度撑高布局。

## 36. 归档封面融入文章行（2026-09-06）

根据视觉反馈，归档封面不再作为独立的右侧缩略图占位，而是绝对定位在文章行最右侧，并使用从左侧透明到右侧可见的渐变遮罩融入背景。标题和标签保持在图片上层，悬停时封面向左扩展并轻微缩放，形成 blog-v3 的一体化展示效果。

## 37. 增加站点重建通知（2026-09-07）

在全站导航栏下方增加轻量通知条，提示访客前往 `https://nuxt.olinl.com` 阅读迁移后的文章。通知支持新窗口打开目标站点，并提供关闭按钮；关闭状态写入 `localStorage`，避免同一浏览器每次访问都重复打扰。通知采用导航栏下方定位，不占用正文布局，也不使用居中弹框遮挡内容。

## 38. 上传文章内容并迁移文章目录（2026-09-07）

将本地文章内容正式上传到远端：

- 原 `src/content/posts` 下的文章和配图迁移到 `src/content/firefly-posts`，Git 按重命名记录；
- 新增 `src/content/posts/qq-group.md`；
- 本次提交包含文章正文、Markdown/MDX 文件及配套图片资源。
