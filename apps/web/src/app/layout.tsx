import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GitPress — 你的博客,你的仓库",
    template: "%s · GitPress",
  },
  description:
    "GitPress 把博客内容放进你自己的 GitHub 仓库:私有数据仓库存文章,公开仓库存编译产物,GitHub Actions 自动构建,GitHub Pages / Vercel 托管。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
