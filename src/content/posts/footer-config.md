---
title: 'Firefly 魔改：FooterConfig 页脚模板定制'
slug: 'footer-config'
published: 2026-07-19 15:03:19
updated: 2026-07-22 19:30:00
description: '通过修改 FooterConfig.html 自由定制页脚——技术徽章、社交链接、备案号、运行时长。'
image: https://img.olinl.com/file/post-img/footer-config/cover.webp
category: Firefly 二次开发
tags: [Firefly, 博客, 二开, 配置]
series: Firefly 博客搭建与二次开发
seriesOrder: 7
draft: false
# pinned: false
---

`FooterConfig.html` 是 Firefly 博客页脚的 HTML 模板文件，位于 `src/config/FooterConfig.html`。内容是纯内联 CSS + HTML + 一小段 JavaScript，直接在文件中修改即可生效，无需改动组件代码。

![完整的页脚效果](https://img.olinl.com/file/post-img/footer-config/0001.webp)
## 文件结构

整个文件分五个区域，颜色使用 CSS 变量 `var(--primary)` 跟随主题色自动适配浅色/深色模式。

### 1. 页脚插画

顶部一幅装饰小图，纯美化用。想换图直接改 `src` 路径即可。

```html
<div class="animal-img">
    <img alt="animals" src="/assets/images/animals.webp">
</div>
```

### 2. 技术徽章

每个徽章是一个带链接的图标，指向对应的官网或版权说明页面。当前共六个：

```html
<div class="badge-group">
    <a target="_blank" href="https://astro.build/" title="Astro">
        <img alt="Astro" src="/assets/badges/astro.svg">
    </a>
    <a target="_blank" href="https://tailwindcss.com/" title="TailwindCSS">
        <img alt="TailwindCSS" src="/assets/badges/tailwind.svg">
    </a>
    <a target="_blank" href="https://twikoo.js.org/" title="Twikoo">
        <img alt="Twikoo" src="/assets/badges/twikoo.svg">
    </a>
    <a target="_blank" href="https://edgeone.ai/zh/" title="本站CDN加速 EdgeOne">
        <img alt="EdgeOne" src="https://img.shields.io/badge/zsr-EdgeOne-blue?logo=icloud&label=CDN">
    </a>
    <a target="_blank" href="https://umami.is/" title="Umami">
        <img alt="Umami" src="/assets/badges/umami.svg">
    </a>
    <a target="_blank" href="http://creativecommons.org/licenses/by-nc-sa/4.0/" title="本站内容采用 CC BY-NC-SA 4.0 许可">
        <img alt="Copyright" src="https://img.shields.io/badge/Copyright-BY--NC--SA%204.0-d42328?logo=coursera&logoColor=fff">
    </a>
</div>
```

### 3. 社交链接

使用内联 SVG 图标 + 文字标签，指向博客的各个子站点。当前共四个：

```html
<div class="social-row">
    <a target="_blank" href="https://blog.olinl.com" title="博客">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        <span style="font-size:14px">博客</span>
    </a>
    <a target="_blank" href="https://cloud.olinl.com" title="网盘">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>
        <span style="font-size:14px">网盘</span>
    </a>
    <a target="_blank" href="https://note.olinl.com" title="随笔">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        <span style="font-size:14px">随笔</span>
    </a>
    <a target="_blank" href="https://doc.olinl.com" title="文档">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></svg>
        <span style="font-size:14px">文档</span>
    </a>
</div>
```

### 4. 备案信息

工信部 ICP 备案 + 公安备案，各带一个小图标。

```html
<div class="footer-info">
    <a target="_blank" href="https://beian.miit.gov.cn/">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        苏ICP备2022020192号-1
    </a>
    <a target="_blank" href="https://beian.mps.gov.cn/web/beian/32021302003009">
        <svg width="14" height="14" viewBox="0 0 1024 1024" fill="currentColor"><path d="M778.24 163.84c-76.8-40.96-165.888-61.44-269.312-61.44s-192.512 20.48-269.312 61.44h-133.12l23.552 337.92c8.192 113.664 67.584 217.088 162.816 280.576l215.04 144.384 215.04-144.384c96.256-63.488 155.648-166.912 163.84-280.576l23.552-337.92H778.24z m47.104 333.824c-7.168 94.208-56.32 181.248-135.168 233.472l-181.248 120.832L327.68 731.136c-78.848-53.248-129.024-139.264-135.168-233.472L173.056 225.28h136.192v-26.624c58.368-23.552 124.928-34.816 199.68-34.816s141.312 12.288 199.68 34.816V225.28H844.8l-19.456 272.384z"/></svg>
        苏公网安备32021302003009号
    </a>
</div>
```

### 5. 运行时长

在 `footer-info` 中加一个 `span#runtime`，由底部的 script 驱动，从建站日开始计算，每秒更新显示。

```html
<span id="runtime">⌛小破站正在加载...</span>
```

```html
<script is:inline="">
if (typeof window.__siteStartTime === 'undefined') {
    window.__siteStartTime = "2026-04-28 00:00:00";
    function startRuntime() {
        var el = document.getElementById('runtime');
        if (!el) return;
        function update() {
            var diff = Date.now() - new Date(window.__siteStartTime).getTime();
            var d = Math.floor(diff / 86400000);
            var h = Math.floor((diff % 86400000) / 3600000);
            var m = Math.floor((diff % 3600000) / 60000);
            var s = Math.floor((diff % 60000) / 1000);
            el.innerHTML = '⌛小破站已运行 <span style="color:#FFA500">' + d + '</span>天 <span style="color:#1DBF97">' + h + '</span>时 <span style="color:#8A2BE2">' + m + '</span>分 <span style="color:#007EC6">' + s + '</span>秒';
        }
        update();
        setInterval(update, 1000);
    }
    startRuntime();
}
</script>
```

## 完整文件一览

```html title="src/config/FooterConfig.html"
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    .badge-footer {
        display: flex;
        flex-direction: column;
        padding: 10px 0;
        font-size: 14px;
        color: var(--primary);
    }
    .animal-img {
        display: flex;
        justify-content: center;
    }
    .badge-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;
        align-items: center;
        justify-content: center;
    }
    .social-row {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: center;
        justify-content: center;
        margin-top: 8px;
    }
    .social-row a {
        color: var(--primary);
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 20px;
        transition: opacity 0.2s;
    }
    .social-row a:hover {
        opacity: 0.7;
    }
    .footer-info {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 6px;
        font-size: 13px;
        color: var(--primary);
        line-height: 1.8;
    }
    .footer-info a {
        color: var(--primary);
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }
    .footer-info a:hover {
        color: #409eff;
    }
</style>

<div class="badge-footer">
    <!-- ① 页脚插画 -->
    <div class="animal-img">
        <img alt="animals" src="/assets/images/animals.webp">
    </div>

    <!-- ② 技术徽章 -->
    <div class="badge-group">
        <a target="_blank" href="https://astro.build/" title="Astro">
            <img alt="Astro" src="/assets/badges/astro.svg">
        </a>
        <a target="_blank" href="https://tailwindcss.com/" title="TailwindCSS">
            <img alt="TailwindCSS" src="/assets/badges/tailwind.svg">
        </a>
        <a target="_blank" href="https://twikoo.js.org/" title="Twikoo">
            <img alt="Twikoo" src="/assets/badges/twikoo.svg">
        </a>
        <a target="_blank" href="https://edgeone.ai/zh/" title="本站CDN加速 EdgeOne">
            <img alt="EdgeOne" src="https://img.shields.io/badge/zsr-EdgeOne-blue?logo=icloud&label=CDN">
        </a>
        <a target="_blank" href="https://umami.is/" title="Umami">
            <img alt="Umami" src="/assets/badges/umami.svg">
        </a>
        <a target="_blank" href="http://creativecommons.org/licenses/by-nc-sa/4.0/" title="本站内容采用 CC BY-NC-SA 4.0 许可">
            <img alt="Copyright" src="https://img.shields.io/badge/Copyright-BY--NC--SA%204.0-d42328?logo=coursera&logoColor=fff">
        </a>
    </div>

    <!-- ③ 社交链接 -->
    <div class="social-row">
        <a target="_blank" href="https://blog.olinl.com" title="博客">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span style="font-size:14px">博客</span>
        </a>
        <a target="_blank" href="https://cloud.olinl.com" title="网盘">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>
            <span style="font-size:14px">网盘</span>
        </a>
        <a target="_blank" href="https://note.olinl.com" title="随笔">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            <span style="font-size:14px">随笔</span>
        </a>
        <a target="_blank" href="https://doc.olinl.com" title="文档">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></svg>
            <span style="font-size:14px">文档</span>
        </a>
    </div>

    <!-- ④ 备案信息 + 运行时长 -->
    <div class="footer-info">
        <a target="_blank" href="https://beian.miit.gov.cn/">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            苏ICP备2022020192号-1
        </a>
        <a target="_blank" href="https://beian.mps.gov.cn/web/beian/32021302003009">
            <svg width="14" height="14" viewBox="0 0 1024 1024" fill="currentColor"><path d="M778.24 163.84c-76.8-40.96-165.888-61.44-269.312-61.44s-192.512 20.48-269.312 61.44h-133.12l23.552 337.92c8.192 113.664 67.584 217.088 162.816 280.576l215.04 144.384 215.04-144.384c96.256-63.488 155.648-166.912 163.84-280.576l23.552-337.92H778.24z m47.104 333.824c-7.168 94.208-56.32 181.248-135.168 233.472l-181.248 120.832L327.68 731.136c-78.848-53.248-129.024-139.264-135.168-233.472L173.056 225.28h136.192v-26.624c58.368-23.552 124.928-34.816 199.68-34.816s141.312 12.288 199.68 34.816V225.28H844.8l-19.456 272.384z"/></svg>
            苏公网安备32021302003009号
        </a>
        <span id="runtime">⌛小破站正在加载...</span>
    </div>
</div>

<!-- ⑤ 运行时长脚本 -->
<script is:inline="">
if (typeof window.__siteStartTime === 'undefined') {
    window.__siteStartTime = "2026-04-28 00:00:00";
    function startRuntime() {
        var el = document.getElementById('runtime');
        if (!el) return;
        function update() {
            var diff = Date.now() - new Date(window.__siteStartTime).getTime();
            var d = Math.floor(diff / 86400000);
            var h = Math.floor((diff % 86400000) / 3600000);
            var m = Math.floor((diff % 3600000) / 60000);
            var s = Math.floor((diff % 60000) / 1000);
            el.innerHTML = '⌛小破站已运行 <span style="color:#FFA500">' + d + '</span>天 <span style="color:#1DBF97">' + h + '</span>时 <span style="color:#8A2BE2">' + m + '</span>分 <span style="color:#007EC6">' + s + '</span>秒';
        }
        update();
        setInterval(update, 1000);
    }
    startRuntime();
}
</script>
```

## 相关文件

HTML 模板：[/src/config/FooterConfig.html](https://github.com/olinll/firefly-blog/blob/master/src/config/FooterConfig.html)

相关源码：[olinll/firefly-blog](https://github.com/olinll/firefly-blog)

## 🔗 最后

FooterConfig.html 的定位就是一个"傻瓜式"模板——不需要懂 Astro 组件、不需要配置 TypeScript，打开 HTML 文件直接改你想改的部分就行。想加个徽章就复制一行 `<a>`，想换个图标就改一下 SVG，零学习成本。
