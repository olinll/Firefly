/** RSS 输出配置。slug 对应 src/content/posts 下的文件名（不含 .md）。 */
export const rssConfig = {
	/** 不出现在 /rss.xml 和 /rss/ 最新文章预览中的文章。 */
	excludedPostIds: ["qq-group"],
} as const;
