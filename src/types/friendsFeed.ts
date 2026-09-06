export type FriendFeedEntry = {
	author: string;
	sitenick?: string;
	title?: string;
	desc?: string;
	link: string;
	feed?: string;
	icon: string;
	avatar: string;
	archs?: string[];
	date: string;
	comment?: string;
};

export type FriendFeedGroup = {
	name: string;
	desc?: string;
	entries: FriendFeedEntry[];
};
