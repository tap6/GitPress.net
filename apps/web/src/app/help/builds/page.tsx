import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "构建是怎么跑的",
  description:
    "保存后任务已经在 GitHub Actions 上，可以离开本页。再次保存会取消进行中的那次，改跑最新一次。",
};

export default function BuildsHelpPage() {
  return (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">帮助</p>
      <p className="mt-2">
        <Link href="/help" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← 全部帮助
        </Link>
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">构建是怎么跑的</h1>
      <p className="mt-4 leading-relaxed text-neutral-500">
        顶部「已收到数据 / 正在从数据仓构建并推送到网站仓」表示这次更改已经写进私有数据仓，GitHub Actions 正在编译并推到公开网站仓，不是卡在浏览器里。可以关标签、去写下一篇。
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">可以离开吗?</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          可以。保存成功后,文件已经在私有数据仓里。云端 workflow 自己编译、再推到公开网站仓。后台那条进度只是本页在问
          GitHub「跑到哪了」,关掉页面不影响构建。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">又点了一次保存呢?</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          不会排队等上一次结束,也不会两台机器同时编同一份站点。新的 push 会<strong>取消</strong>
          进行中的那次,只留最新一次。连续保存几次通常没问题,中间那几次会出现在仪表盘「最近构建」里,状态是「已取消」。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">要多久?</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          多数站点 60–120 秒。第一次或刚换主题可能更久。仪表盘能看最近几次;也可以点状态条里的「在 GitHub 查看」。
        </p>
      </section>

      <p className="mt-10 text-sm text-neutral-500">
        草稿保存也会触发构建,但公开站点不会出现那篇。见{" "}
        <Link href="/help/drafts-and-builds" className="underline hover:text-neutral-800">
          底稿、草稿和已发布
        </Link>
        。
      </p>
    </>
  );
}
