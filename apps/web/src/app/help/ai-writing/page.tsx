import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "用 AI 写初稿和摘要",
  description: "在编辑器里生成 Markdown 初稿，先预览再插入。需要先在设置里填自己的 AI 接口。",
};

export default function AiWritingHelpPage() {
  return (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">帮助</p>
      <p className="mt-2">
        <Link href="/help" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← 全部帮助
        </Link>
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">用 AI 写初稿和摘要</h1>
      <p className="mt-4 leading-relaxed text-neutral-500">
        GitPress 不代管模型。你在账号里填自己的 OpenAI 兼容接口,编辑器才能生成初稿和摘要。
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">先配置</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          打开任意站点的设置 → AI 写作,填 Base URL、模型名和 API Key。这份配置跟账号走,对你名下所有站点生效。密钥存在
          GitPress 控制面,加密存放。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">AI 初稿</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
          <li>在可视化编辑器工具栏点「AI 初稿」(源码模式不可用)。</li>
          <li>写下主题或要点,可选语气和篇幅,生成后先看预览。</li>
          <li>「插入光标处」或「替换全文」。这时候还只在编辑器里,点保存才会进仓库。</li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">AI 摘要</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          文章侧栏「摘要」旁可以按当前正文生成一两句说明,写进 frontmatter 的 description。同样要保存后才进仓库。
        </p>
      </section>
    </>
  );
}
