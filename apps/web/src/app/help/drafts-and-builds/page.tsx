import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "底稿、草稿和已发布",
  description:
    "本地底稿只在这台浏览器。草稿会写入私有仓库并触发构建，但不会出现在公开网站。",
};

export default function DraftsAndBuildsHelpPage() {
  return (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">帮助</p>
      <p className="mt-2">
        <Link href="/help" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← 全部帮助
        </Link>
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">底稿、草稿和已发布</h1>
      <p className="mt-4 leading-relaxed text-neutral-500">
        「不进入构建」容易听成「不会跑构建」。实际是：草稿会写入 GitHub,也会触发构建,但公开网站不会出现这篇。
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">三种状态</h2>
        <dl className="mt-3 space-y-4 text-sm leading-relaxed text-neutral-600">
          <div>
            <dt className="font-medium text-neutral-800">本地底稿</dt>
            <dd className="mt-1">
              编辑器自动写在这台浏览器里。没点保存之前,不上 GitHub,也不触发构建。换电脑或清掉站点数据就会没。
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-800">草稿 · 不公开</dt>
            <dd className="mt-1">
              点「保存到仓库」后,文章进私有数据仓 <code className="rounded bg-neutral-100 px-1">content/posts/</code>
              ,frontmatter 带 <code className="rounded bg-neutral-100 px-1">draft: true</code>
              。构建会跑,主题会把这篇滤掉,公开站点、RSS、导航里都没有。
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-800">已发布</dt>
            <dd className="mt-1">
              同样写入私有仓并触发构建。日期已到的文章会出现在公开网站。日期还在未来的,构建时仍会排除。
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">点保存之后发生了什么</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
          <li>后台把 Markdown 提交到你的私有数据仓库。</li>
          <li>这次 push 触发 GitHub Actions 构建。</li>
          <li>主题只收录「已发布且日期已到」的文章,编进公开网站仓库。</li>
          <li>GitHub Pages(或你接的托管)更新公开站点。</li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">页面没有草稿</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          About 这类独立页保存后就会出现在公开站点。想先写后发,先写在文章里当草稿,或先不链进菜单。
        </p>
      </section>

      <p className="mt-10 text-sm text-neutral-500">
        构建能不能离开、第二次保存会怎样,见{" "}
        <Link href="/help/builds" className="underline hover:text-neutral-800">
          构建是怎么跑的
        </Link>
        。
      </p>
    </>
  );
}
