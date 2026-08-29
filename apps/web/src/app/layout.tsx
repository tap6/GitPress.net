import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GitPress — 你的博客,你的仓库",
    template: "%s · GitPress",
  },
  description:
    "GitPress.net 是云端写作工具,不是内容托管商。文章、图片、草稿都在你自己的 GitHub 仓库里;平台只保存账号与站点指针。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
