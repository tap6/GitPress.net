import type { Metadata } from "next";
import { HelpSearch } from "@/components/HelpSearch";
import { HELP_ARTICLES } from "@/lib/helpArticles";

export const metadata: Metadata = {
  title: "帮助",
  description: "这是什么项目、隐私、做主题、草稿、构建、统计、主题导入和域名：GitPress 后台常见问题。",
};

export default function HelpIndexPage() {
  return (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">帮助</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">作者常见问题</h1>
      <p className="mt-4 leading-relaxed text-neutral-500">
        先从「这是什么项目？」看三块分别管什么。其余是后台用得到的说明，不是独立文档站。
      </p>
      <div className="mt-8">
        <HelpSearch articles={HELP_ARTICLES} />
      </div>
    </>
  );
}
