---
title: 'Firefly 魔改：全局复制事件监听与提示浮层'
slug: 'copy-toast'
published: 2026-07-21 19:41:32
updated: 2026-07-22 19:30:00
description: '全局监听复制事件，复制成功后底部弹出提示浮层，附带动画进度条。'
image: https://img.olinl.com/file/post-img/copy-toast/cover.webp
category: Firefly 二次开发
tags: [Firefly, 博客, 二开, 交互]
series: Firefly 博客搭建与二次开发
seriesOrder: 9
draft: false
pinned: false
---

当访客复制博客内容时，顶部自动弹出"复制成功，转载请标注本文地址"的提示浮层，并带有一个进度条动画——既友好地提醒了版权，又提供了优雅的视觉反馈。
## 一、功能概览

![复制提示浮层弹出的效果截图](https://img.olinl.com/file/post-img/copy-toast/0001.webp)
- 监听全局 `copy` 事件
- 顶部滑入提示浮层，3 秒后自动消失
- 进度条从左到右动画，模拟倒计时
- 支持浅色/深色模式

## 二、实现细节

### Svelte 组件

```svelte title="src/components/common/CopyMessage.svelte"
<script lang="ts">
import { onMount } from "svelte";

const SHOW_DURATION = 3000;
let isVisible = $state(false);
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

const showCopyMessage = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  isVisible = false;
  setTimeout(() => {
    isVisible = true;
    hideTimeout = setTimeout(() => {
      isVisible = false;
    }, SHOW_DURATION);
  }, 10); // 短暂延迟触发重排
};

const handleCopy = () => {
  const selection = window.getSelection();
  if (selection?.toString().trim()) showCopyMessage();
};

onMount(() => {
  document.addEventListener("copy", handleCopy);
  return () => {
    document.removeEventListener("copy", handleCopy);
    if (hideTimeout) clearTimeout(hideTimeout);
  };
});
</script>

<div class="copy-message" class:show={isVisible}>
  <div class="message-background">
    <div class="progress-bar" class:active={isVisible}></div>
  </div>
  <div class="message-content">
    <span class="text">✨️ 复制成功，转载请标注本文地址</span>
  </div>
</div>

<style>
  .copy-message {
    --duration: 3000ms;
    --height: 50px;
    --transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    --bg-gradient: linear-gradient(90deg, var(--primary) 0%, var(--primary) 25%, var(--primary) 50%, var(--primary) 75%, var(--primary) 100%);
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: var(--height);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    transform: translateY(-100%);
    transition: var(--transition), opacity 0.4s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    opacity: 0;
  }

  .copy-message.show { transform: translateY(0); opacity: 1; }

  .copy-message .message-background {
    position: absolute;
    inset: 0;
    background: var(--bg-gradient);
    z-index: 1;
  }

  .copy-message .progress-bar {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    z-index: 2;
    transform: translateX(0);
    transition: transform 0ms;
  }

  .copy-message .progress-bar.active {
    transform: translateX(200%);
    transition: transform var(--duration) linear;
  }

  .copy-message .message-content {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: white;
    position: relative;
    z-index: 3;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    .copy-message { --height: 44px; }
    .copy-message .message-content {
      font-size: 14px;
      padding: 0 16px;
      text-align: center;
    }
  }

  @media (prefers-color-scheme: dark) {
    .copy-message {
      --bg-gradient: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
    }
  }
</style>
```

> [!TIP] 重排技巧
> 先设为 `false` 再延迟设为 `true`，是为了触发浏览器重排让进度条动画能重新播放。

![进度条动画过程](https://img.olinl.com/file/post-img/copy-toast/0002.webp)

`src/components/common/CopyMessage.svelte` — showCopyMessage 函数变更：

```svelte title="src/components/common/CopyMessage.svelte" del={1} ins={2-5}
  if (hideTimeout) clearTimeout(hideTimeout);
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
```

`src/components/common/CopyMessage.svelte` — onMount 清理变更：

```svelte title="src/components/common/CopyMessage.svelte" del={1} ins={2-5}
  return () => document.removeEventListener("copy", handleCopy);
  return () => {
    document.removeEventListener("copy", handleCopy);
    if (hideTimeout) clearTimeout(hideTimeout);
  };
```

`src/components/common/CopyMessage.svelte` — CSS 分层重构：

```css title="src/components/common/CopyMessage.svelte" del={1} ins={2-10}
  .copy-message .progress-bar.active { transform: translateX(200%); transition: transform var(--duration) linear; }
  .copy-message .message-background { position: absolute; inset: 0; background: var(--bg-gradient); z-index: 1; }
  .copy-message .progress-bar { position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%); z-index: 2; transform: translateX(0); transition: transform 0ms; }
  .copy-message .progress-bar.active { transform: translateX(200%); transition: transform var(--duration) linear; }
  .copy-message .message-content { display: flex; align-items: center; font-size: 16px; font-weight: 600; color: white; position: relative; z-index: 3; text-shadow: 0 1px 2px rgba(0,0,0,0.15); }
  @media (max-width: 768px) { .copy-message { --height: 44px; } .copy-message .message-content { font-size: 14px; padding: 0 16px; text-align: center; } }
  @media (prefers-color-scheme: dark) { .copy-message { --bg-gradient: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); } }
```

## 三、使用方式

在 `Layout.astro` 中全局挂载（位于 `<MusicManager />` 之后、`<slot />` 之前）：

```astro title="src/layouts/Layout.astro" ins={3}
<ConfigCarrier />
<MusicManager />
<CopyMessage client:load />
<slot />
```

## 四、相关文件

组件：[/src/components/common/CopyMessage.svelte](https://github.com/olinll/firefly-blog/blob/master/src/components/common/CopyMessage.svelte)

布局：[/src/layouts/Layout.astro](https://github.com/olinll/firefly-blog/blob/master/src/layouts/Layout.astro)

相关源码：[olinll/firefly-blog](https://github.com/olinll/firefly-blog)

## 🔗 最后

一个 Svelte 文件，监听一个事件，3 秒自动消失——实现简单但用户体验加分。想自定义提示文字，直接在源码中修改即可。
