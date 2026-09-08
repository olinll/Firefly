---
title: 'Firefly 魔改：IP 定位欢迎弹窗组件'
slug: 'welcome-toast'
published: 2026-07-04 15:51:31
updated: 2026-07-22 19:30:00
description: '首次访问时右下角弹出欢迎提示，显示访客所在地，5 秒后自动关闭。'
image: https://img.olinl.com/file/post-img/welcome-toast/cover.webp
category: Firefly 二次开发
tags: [Firefly, 博客, 二开, 交互]
series: Firefly 博客搭建与二次开发
seriesOrder: 5
draft: false
pinned: false
---

当访客第一次打开你的博客时，右下角弹出一个轻巧的欢迎提示，显示"你好，来自 XX 的朋友"，5 秒后自动消失——这种小细节能让博客更有人情味。

## 一、功能概览

![欢迎弹框的效果](https://img.olinl.com/file/post-img/welcome-toast/0001.webp)

核心流程：
1. 检查 `sessionStorage` 中是否已有访问标记
2. 首次访问 → 调用 IP 定位 API 获取所在地
3. 右下角弹出欢迎 Toast，5 秒后自动关闭
4. 同一会话内不再重复弹出

## 二、实现细节

### 会话控制

```typescript title="src/components/widget/WelcomeToast.astro"
const VISIT_SESSION_KEY = "blog_visit_flag";

// 检查是否已弹过
if (sessionStorage.getItem(VISIT_SESSION_KEY)) return;

// 显示弹窗后标记
sessionStorage.setItem(VISIT_SESSION_KEY, "true");
```

### 获取访客位置

```typescript title="src/components/widget/WelcomeToast.astro"
fetch("https://v2.xxapi.cn/api/ip")
  .then(res => res.json())
  .then(data => {
    const address = data.data?.address || "";
    message.textContent = address
      ? `你好，来自 ${address} 的朋友 👋`
      : "你好，欢迎来到我的博客 👋";
  })
  .catch(() => {
    message.textContent = "你好，欢迎来到我的博客 👋";
  });
```

### 动画与关闭

```js title="src/components/widget/WelcomeToast.astro"
// 弹入动画
toast.classList.remove("translate-y-full", "opacity-0");

// 5 秒后自动关闭
setTimeout(() => {
  toast.classList.add("translate-y-full", "opacity-0");
}, 5000);

// 手动关闭
window.__closeWelcomeToast = () => {
  toast.classList.add("translate-y-full", "opacity-0");
};
```

## 三、核心代码

组件本身是一个自执行的 Astro 脚本组件，直接查看文件内容：

```astro title="src/components/widget/WelcomeToast.astro"
---
// 欢迎提示组件 —— 首次访问时从右下角弹出，显示访客所在地
---

<script>
  const VISIT_SESSION_KEY = "blog_visit_flag";
  let hasShownToast = false;

  function createWelcomeToast(): HTMLElement { /* ... DOM 构建 ... */ }
  function closeWelcomeToast(): void { /* ... 关闭动画 ... */ }

  async function fetchLocation(): Promise<void> {
    try {
      const response = await fetch("https://v2.xxapi.cn/api/ip");
      const data = await response.json();
      if (data.code === 200 && data.data) {
        const locationText = `你好，来自${data.data.address}的朋友`;
        document.getElementById("welcome-message")!.textContent = locationText;
      }
    } catch {
      document.getElementById("welcome-message")!.textContent = "你好，欢迎来到我的博客";
    }
  }

  async function showWelcomeToast(): Promise<void> {
    if (hasShownToast) return;
    const toast = createWelcomeToast();
    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-full", "opacity-0");
      toast.classList.add("translate-y-0", "opacity-100");
    });
    hasShownToast = true;
    await fetchLocation();
    setTimeout(() => closeWelcomeToast(), 5000);
  }

  function initWelcome(): void {
    if (!sessionStorage.getItem(VISIT_SESSION_KEY)) {
      sessionStorage.setItem(VISIT_SESSION_KEY, "true");
      showWelcomeToast();
    }
  }

  window.__closeWelcomeToast = closeWelcomeToast;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWelcome);
  } else {
    initWelcome();
  }
</script>
```

若要启用，在 `src/layouts/Layout.astro` 中导入并挂载：

```js title="src/layouts/Layout.astro" ins={4,9}
import FontSetup from "@components/features/FontSetup.astro";
import MusicManager from "@components/features/MusicManager.astro";
import SakuraEffect from "@components/features/SakuraEffect.astro";
import WelcomeToast from "@components/widget/WelcomeToast.astro";
import ConfigCarrier from "@components/layout/ConfigCarrier.astro";
// ...
    <!-- Sakura Effect -->
    <SakuraEffect />
    <WelcomeToast />
    <!-- Fancybox Manager -->
```

## 四、相关文件

组件：[/src/components/widget/WelcomeToast.astro](https://github.com/olinll/firefly-blog/blob/master/src/components/widget/WelcomeToast.astro)

相关源码：[olinll/firefly-blog](https://github.com/olinll/firefly-blog)

## 🔗 最后

通过 IP 定位让每位访客感受到被欢迎，同时 `sessionStorage` 保证了不打扰体验。如果你有更好的 IP 定位 API，替换请求地址即可。

相关源码：[Firefly 博客 - WelcomeToast.astro](https://github.com/olinll/firefly-blog)
