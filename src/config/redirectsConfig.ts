import type { RedirectsConfig } from "../types/redirectsConfig";

/**
 * 短链接 / 重定向映射表
 *
 * 使用 Astro 内置的 redirects 功能生成静态重定向页面。
 * 支持两类目标：
 * 1. 内部路径：如 "/link" -> "/friends/"，浏览器 301 跳转到站内页面
 * 2. 外部链接：如 "/avatar-qlogo" -> "https://...", 浏览器直接跳转到外部 URL
 *
 * 示例：
 * - 访问 https://blog.olinl.com/link  → 跳转到 /friends/ 友链页
 * - 访问 https://blog.olinl.com/avatar-qlogo → 获取 QQ 头像
 */
export const redirectsConfig: RedirectsConfig = {
	// 示例 - 按需添加：
	// "/q": "/posts/qq-group/",
	// "/link": "/friends/",
	// "/f": "/friends/",
};
