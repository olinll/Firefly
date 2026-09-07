/**
 * 重定向配置类型
 *
 * Key: 源路径（短路径），必须以 / 开头
 * Value: 目标地址（内部路径或外部 URL）
 *
 * 内部路径: "/link" -> "/friends/"
 * 外部链接: "/avatar-qlogo" -> "https://..."
 */
export type RedirectsConfig = Record<string, string>;
