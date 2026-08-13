import type { FriendLink, FriendsPageConfig } from "../types/friendsConfig";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "",

	// 是否显示底部自定义内容（friends.mdx 中的内容）
	showCustomContent: true,

	// 是否显示评论区，需要先在commentConfig.ts启用评论系统
	showComment: true,

	// 是否开启随机排序配置，如果开启，就会忽略权重，构建时进行一次随机排序
	randomizeSort: true,
};

// 友链配置
export const friendsConfig: FriendLink[] = [
	{
		title: "夏夜流萤",
		imgurl:
			"https://weavatar.com/avatar/d252655d40d6874417a720bad0a6c5f77f8f6a1fd2f882f8f338402dc37e4190?s=640",
		desc: "飞萤之火自无梦的长夜亮起，绽放在终竟的明天。",
		siteurl: "https://blog.cuteleaf.cn",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},
	{
		title: "Firefly Docs",
		imgurl: "https://docs-firefly.cuteleaf.cn/logo.png",
		desc: "Firefly主题模板文档",
		siteurl: "https://docs-firefly.cuteleaf.cn",
		tags: ["Docs"],
		weight: 5,
		enabled: true,
	},
	{
		title: "他说",
		imgurl: "https://090909.top/assets/images/logo.ico",
		desc: "梁栋烨的博客网站。",
		siteurl: "https://090909.top/",
		tags: ["Hexo"],
		weight: 5,
		enabled: true,
	},
	{
		title: "Hyper001’s Blog",
		imgurl: "https://blog.hyper001.cn/images/avatar.jpeg",
		desc: "记录学习，分享生活，保持热爱，奔赴山海。",
		siteurl: "https://blog.hyper001.cn/",
		tags: ["Valaxy"],
		weight: 5,
		enabled: true,
	},
	{
		title: "小枫_QWQ的Blog",
		imgurl:
			"https://q.qlogo.cn/headimg_dl?dst_uin=1432777209&spec=640&img_type=jpg",
		desc: "欢迎来到小枫_QWQ的Blog！这是一个致力于分享前后端技术的博客。同时也分享一些闲聊碎语",
		siteurl: "https://blog.xiaofengqwq.com/",
		tags: ["Typecho"],
		weight: 5,
		enabled: true,
	},
	{
		title: "TT清沫uk",
		imgurl:
			"https://ts1.tc.mm.bing.net/th/id/OIP-C.6WsD9caLSNQFhJOi77soRAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
		desc: "TT清沫ukの博客",
		siteurl: "https://ttquk.github.io/",
		tags: ["Hexo"],
		weight: 5,
		enabled: true,
	},
	{
		title: "高新炀的小站",
		imgurl: "https://gxy.cn.mt/assets/avatar.webp",
		desc: "一个装着些稀奇古怪东西的个人小站，欢迎来逛逛~",
		siteurl: "https://gxy.cn.mt/",
		tags: ["Python"],
		weight: 5,
		enabled: true,
	},
	{
		title: "番茄主理人",
		imgurl: "https://q1.qlogo.cn/g?b=qq&nk=20447289&s=640",
		desc: "坐而言不如起而行.",
		siteurl: "https://www.fqzlr.com/",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},
	{
		title: "MmzMing的知识库",
		imgurl: "https://i.stardots.io/784774835/StarDots-2026052116374135506.jpg",
		desc: "哈基米，南北绿豆",
		siteurl: "https://tblog.mmzhiku.xyz",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},
	{
		title: "Hyde Blog",
		imgurl: "https://seasir.top/assets/avatar.avif",
		desc: "人心中的成见是一座大山",
		siteurl: "https://seasir.top/",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},
	{
		title: "涵哲子居",
		imgurl: "https://iluc.cn/logo.webp",
		desc: "天哲地理，共公卿好",
		siteurl: "https://iluc.cn/",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},
	{
		title: "MineDensity",
		imgurl: "https://www.minedensity.top/favicon.svg",
		desc: "这个网站是我送给互联网的一本手绘笔记。如果你在这里找到了什么让你停留的东西，那我们就已经是朋友了。",
		siteurl: "https://www.minedensity.top/",
		tags: ["Vue"],
		weight: 5,
		enabled: true,
	},

	{
		title: "gc的小站",
		imgurl: "https://www.gcweb.cc/static/img/pig.jpg",
		desc: "综合性网站，希望能对你有帮助",
		siteurl: "https://gcweb.cc/",
		tags: ["AMP"],
		weight: 5,
		enabled: true,
	},

	{
		title: "陶然",
		imgurl: "https://taoran.weppp.cyou/favicon.svg",
		desc: "一团温暖的粘土博客",
		siteurl: "https://taoran.weppp.cyou/",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},

	{
		title: "miuo’s blog",
		imgurl: "https://miuo.me/avatar.avif",
		desc: "记录文章、笔记、实验和暂时不想丢掉的内容。",
		siteurl: "https://miuo.me/",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},

	{
		title: "十三",
		imgurl: "https://blog.nw177.cn/assets/avatar.webp",
		desc: "欲买桂花同载酒，终不似，少年游。",
		siteurl: "https://blog.nw177.cn/",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},

	{
		title: "灵光一刻|SUPERSTAR",
		imgurl: "https://wuliqun.cn/star.png",
		desc: "只为了记录每个时刻的想法",
		siteurl: "https://wuliqun.cn/",
		tags: ["Vue"],
		weight: 5,
		enabled: true,
	},
	{
		title: "MineAPK",
		imgurl: "https://mcae.cn/uploads/MineAPKlogo.png",
		desc: "目前是一个我的世界版本库",
		siteurl: "https://mcae.cn/",
		tags: ["HTML"],
		weight: 5,
		enabled: true,
	},
	{
		title: "笔尖代码",
		imgurl: "https://123456l.com/assets/images/logo.png",
		desc: "笔尖代码 - 一份汇聚前端、后端、数据库、运维、系统知识的个人技术文档库",
		siteurl: "https://123456l.com/",
		tags: ["PHP"],
		weight: 5,
		enabled: true,
	},
	{
		title: "Zorro‘s Blog",
		imgurl: "https://blog.zuodev.top/file/picture/UserPicture.png",
		desc: "记录生活、分享技术",
		siteurl: "https://blog.zuodev.top/",
		tags: ["Vue"],
		weight: 5,
		enabled: true,
	},
	{
		title: "xane",
		imgurl:
			"https://cloudflare-imgbed-d88.pages.dev/file/1784102742642_头像.jpg",
		desc: "Keep going.",
		siteurl: "https://xane.eu.cc",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},
	{
		title: "Zero - 浮生",
		imgurl: "https://vtdd.vip/_astro/avatar.ryzKiMN3_19g6Gw.webp",
		desc: "浮生一刹万般皆舍.",
		siteurl: "https://vtdd.vip",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},
	{
		title: "萧小晓",
		imgurl: "https://www.lxlovo.top/png.png",
		desc: "一个爱写文的菜鸡。",
		siteurl: "https://blog.lxlovo.top",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},
	{
		title: "极客指北",
		imgurl: "https://www.90svip.cn/logo.png",
		desc: "探索科技之路，分享美好生活！",
		siteurl: "https://www.90svip.cn",
		tags: ["PHP"],
		weight: 5,
		enabled: true,
	},
	{
		title: "年华",
		imgurl: "https://q1.qlogo.cn/g?b=qq&nk=1323860289&s=640",
		desc: "分享生活和技术。",
		siteurl: "https://blog.amamo.top",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},
	{
		title: "Aimerting",
		imgurl: "https://blog.xuioo.com/avatar.jpg",
		desc: "「纯粹祈愿皆成真」",
		siteurl: "https://blog.xuioo.com/",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},
	{
		title: "Xixmu",
		imgurl: "https://xixmu.top/_astro/head_ima.rsW3s28l_1KtIxl.avif",
		desc: "在记忆干枯前描绘。",
		siteurl: "https://xixmu.top",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},
	{
		title: "星诺的博客",
		imgurl: "https://blog.astrvow.com/_astro/logo.DuHgmi9I_1k5uPc.webp",
		desc: "只要热爱，太阳就会升起！",
		siteurl: "https://blog.astrvow.com/",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},
	{
		title: "SilverCode_Nexus",
		imgurl: "https://cdn.replow.org/replow-org/images/tx.ico",
		desc: "Replow的小站",
		siteurl: "https://www.replow.org/",
		tags: ["PHP"],
		weight: 5,
		enabled: true,
	},
	{
		title: "SkyのXnok",
		imgurl: "https://201562.xyz/avatar.png",
		desc: "记录学习、生活与思考",
		siteurl: "https://201562.xyz/",
		tags: ["Astro"],
		weight: 5,
		enabled: true,
	},
	{
		title: "Silvaire's Blog",
		imgurl: "https://wsrv.nl/?url=avatars.githubusercontent.com/u/184231508?s=400&u=0a370792ba6bbb95a04d309171b562bcd7283a0f&v=3",
		desc: "A student who is learning frontend development",
		siteurl: "https://silvaire.top/",
		tags: ["Vue"],
		weight: 5,
		enabled: true,
	},
];

// 获取启用的友链并进行排序
export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);

	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}

	return friends.sort((a, b) => b.weight - a.weight);
};
