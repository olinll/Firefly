---
title: 'Firefly 魔改：自定义鼠标指针样式'
slug: 'custom-cursor'
published: 2026-07-21 19:41:32
updated: 2026-07-22 19:30:00
description: '使用 .cur 文件替换默认鼠标样式，区分默认态和可点击元素。'
image: https://img.olinl.com/file/post-img/custom-cursor/cover.webp
category: Firefly 二次开发
tags: [Firefly, 博客, 二开, 样式]
series: Firefly 博客搭建与二次开发
seriesOrder: 10
draft: false
pinned: false
---

一个小小的视觉彩蛋——把千篇一律的默认鼠标指针换成定制的 `.cur` 样式，让博客的每个细节都打上自己的印记。

## 一、设计思路


- 使用 `.cur`（静态光标）文件，兼容性最好
- 区分两种状态：默认光标和指针光标
- 纯 CSS 实现，零 JavaScript 开销

## 二、实现细节

### CSS 变量

```css title="src/styles/mouse.css"
:root {
  --cursor-default: url('/mouse/default.cur'), default;
  --cursor-pointer: url('/mouse/pointer.cur'), pointer;
}

html, body {
  cursor: var(--cursor-default);
}

a, button, input[type="button"], input[type="submit"], input[type="reset"],
[type="button"], [type="submit"], [type="reset"],
button, select, label,
[role="button"], [role="link"],
.cursor-pointer {
  cursor: var(--cursor-pointer);
}

input, textarea, [contenteditable="true"] {
  cursor: text;
}
```

<!-- 截图占位：可点击/非可点击元素的指针对比截图 -->
![可点击元素的指针](https://img.olinl.com/file/post-img/custom-cursor/0001.webp)
![非可点击元素的指针](https://img.olinl.com/file/post-img/custom-cursor/0002.webp)
### 鼠标文件

两个 `.cur` 文件放在 `public/mouse/`：
- `default.cur` — 默认箭头样式
- `pointer.cur` — 手型指针样式

用工具（如 [RealWorld Cursor Editor](https://www.rw-designer.com/cursor-maker)）制作自己的 `.cur` 文件替换即可。

### 全局导入

在 `src/layouts/Layout.astro` 的 frontmatter 区域与其他全局样式一起引入：

```astro title="src/layouts/Layout.astro" ins={4}
import "@/styles/main.css";
import "@/styles/variables.styl";
import "@/styles/markdown-extend.styl";
import "@/styles/mouse.css";
import "@rehype-callouts-theme";
```

## 三、自定义方法

想换鼠标样式只要三步：

1. 准备 `.cur` 文件
2. 覆盖 `public/mouse/` 下的对应文件
3. 或在 CSS 中修改路径指向新文件

> [!CAUTION] 注意
> `.cur` 是静态光标格式，不支持动画。若需要动态光标需用 `.ani` 格式，但浏览器兼容性较差。

## 四、相关文件

CSS 样式：[/src/styles/mouse.css](https://github.com/olinll/firefly-blog/blob/master/src/styles/mouse.css)

鼠标文件：[/public/mouse/default.cur](https://github.com/olinll/firefly-blog/blob/master/public/mouse/default.cur)

鼠标文件：[/public/mouse/pointer.cur](https://github.com/olinll/firefly-blog/blob/master/public/mouse/pointer.cur)

相关源码：[olinll/firefly-blog](https://github.com/olinll/firefly-blog)

## 🔗 最后

鼠标指针是最容易被忽略但也最频繁接触的交互元素，花几分钟定制一下，能给博客带来独特的个性。
