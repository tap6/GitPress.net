export interface HelpArticleMeta {
  href: string;
  title: string;
  summary: string;
  keywords: string[];
}

export const HELP_ARTICLES: HelpArticleMeta[] = [
  {
    href: "/help/what-is-gitpress",
    title: "GitPress 是什么？",
    summary:
      "GitPress 是博客后台：像 WordPress 一样写，稿子在你的 GitHub，编成静态站。适合谁、和 Hugo / WordPress / VitePress 差在哪，以及为什么会做。",
    keywords: [
      "介绍",
      "是什么",
      "开源",
      "gitpress",
      "build-action",
      "GitPress.net",
      "关停",
      "仓库",
      "数据",
      "退出",
      "WordPress",
      "Hugo",
      "VitePress",
      "Gridea",
      "SSG",
      "服务器",
      "遗失",
    ],
  },
  {
    href: "/privacy",
    title: "隐私：我们留了什么",
    summary: "账号和站点指针在控制面。正文、媒体、公开 HTML 只在你的 GitHub。卸载 App 之后我们读不到内容。",
    keywords: ["隐私", "不保存", "正文", "服务器", "Postgres", "授权", "缓存"],
  },
  {
    href: "/help/make-theme",
    title: "用 AI 做主题",
    summary: "复制第一条提示词，让你的 AI 先提问再生成 Astro 主题，推到公开仓库后在外观里导入。",
    keywords: ["主题", "AI", "提示词", "theme.json", "做主题", "DIY", "Astro"],
  },
  {
    href: "/help/drafts-and-builds",
    title: "底稿、草稿和已发布",
    summary: "本地底稿只在这台浏览器。草稿会写入私有仓库并触发构建，但不会出现在公开网站。定时发布要先在设置里打开检查。",
    keywords: ["草稿", "底稿", "发布", "保存", "不进入构建", "GitHub", "公开", "定时", "预约", "未来"],
  },
  {
    href: "/help/builds",
    title: "构建是怎么跑的",
    summary: "保存后数据已在私有数据仓，Actions 从那里构建并推到公开网站仓，可以离开本页。再次保存会取消进行中的那次，改跑最新一次。",
    keywords: ["构建", "正在构建", "数据仓", "GitHub", "离开", "取消", "Actions", "排队"],
  },
  {
    href: "/help/ai-writing",
    title: "用 AI 写初稿和摘要",
    summary: "在编辑器里生成 Markdown 初稿，先预览再插入。需要先在设置里填自己的 AI 接口。",
    keywords: ["AI", "初稿", "摘要", "写作", "OpenAI"],
  },
  {
    href: "/help/import-theme",
    title: "从 GitHub 导入主题",
    summary: "先把公开仓库加到本站「我的导入」，启用后才由 Actions 拉取并编译。",
    keywords: ["主题", "导入", "外观", "theme.json", "货架"],
  },
  {
    href: "/help/analytics",
    title: "怎样看访问量",
    summary: "在统计页接入 GA、Clarity、Umami 等。配置在数据仓，数字在各家后台看。",
    keywords: ["统计", "Analytics", "GA", "Clarity", "Umami", "百度", "访问量", "PV"],
  },
  {
    href: "/help/custom-domain",
    title: "用自己的域名访问博客",
    summary: "一级或二级域名都可以。按 GitHub Pages、Vercel、Cloudflare 或其他托管查看步骤。",
    keywords: ["域名", "CNAME", "Pages", "Vercel", "Cloudflare"],
  },
];
