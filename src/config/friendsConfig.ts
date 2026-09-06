import type { FriendLink, FriendsPageConfig } from "../types/friendsConfig";
import { friendsFeedGroups } from "./friendsFeedConfig";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容
export const friendsPageConfig: FriendsPageConfig = {
	title: "",
	description: "",
	showCustomContent: true,
	showComment: true,
	randomizeSort: false,
};

// 兼容旧页面和组件的扁平友链配置；展示页使用 friendsFeedGroups 保留分组信息。
export const friendsConfig: FriendLink[] = friendsFeedGroups.flatMap(
	(group, groupIndex) =>
		group.entries.map((entry, entryIndex) => ({
			title: entry.title || entry.sitenick || entry.author,
			imgurl: entry.avatar,
			desc: entry.desc || "",
			siteurl: entry.link,
			feed: entry.feed,
			icon: entry.icon,
			author: entry.author,
			sitenick: entry.sitenick,
			archs: entry.archs,
			date: entry.date,
			comment: entry.comment,
			tags: [group.name],
			weight: 1000 - groupIndex * 100 - entryIndex,
			enabled: true,
		})),
);

export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);

	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}

	return friends.sort((a, b) => b.weight - a.weight);
};
