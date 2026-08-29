import type { Metadata } from "next";
import Link from "next/link";
import { CustomDomainHelp } from "@/components/CustomDomainHelp";

export const metadata: Metadata = {
  title: "用自己的域名访问博客",
  description:
    "用自己的域名打开 GitPress 站点。按 GitHub Pages、Vercel、Cloudflare 或其他托管查看对应步骤。",
};

export default function CustomDomainHelpPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Git<span className="text-gp-brand">Press</span>
        </Link>
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
          返回首页
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <CustomDomainHelp />
      </main>
    </div>
  );
}
