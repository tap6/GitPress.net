export interface HelpArticleMeta {
  href: string;
  title: string;
  summary: string;
  keywords: string[];
}

export const HELP_ARTICLES: HelpArticleMeta[] = [
  {
    href: "/help/drafts-and-builds",
    title: "底稿、草稿和已发布",
    summary: "本地底稿只在这台浏览器。草稿会写入私有仓库并触发构建，但不会出现在公开网站。",
    keywords: ["草稿", "底稿", "发布", "保存", "不进入构建", "GitHub", "公开"],
  },
  {
    href: "/help/builds",
    title: "构建是怎么跑的",
    summary: "保存后任务已经在 GitHub Actions 上，可以离开本页。再次保存会取消进行中的那次，改跑最新一次。",
    keywords: ["构建", "正在构建", "离开", "取消", "Actions", "排队"],
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
    href: "/help/custom-domain",
    title: "用自己的域名访问博客",
    summary: "一级或二级域名都可以。按 GitHub Pages、Vercel、Cloudflare 或其他托管查看步骤。",
    keywords: ["域名", "CNAME", "Pages", "Vercel", "Cloudflare"],
  },
];
