import type { Metadata } from "next";
import { HelpSearch } from "@/components/HelpSearch";
import { HELP_ARTICLES } from "@/lib/helpArticles";

export const metadata: Metadata = {
  title: "帮助",
  description: "草稿、构建、主题导入和域名：GitPress 后台常见问题。",
};

export default function HelpIndexPage() {
  return (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">帮助</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">作者常见问题</h1>
      <p className="mt-4 leading-relaxed text-neutral-500">
        先搜再点。这里只收后台用得到的说明,不是独立文档站。
      </p>
      <div className="mt-8">
        <HelpSearch articles={HELP_ARTICLES} />
      </div>
    </>
  );
}
