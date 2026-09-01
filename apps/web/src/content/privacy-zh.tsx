import { Link } from "@/i18n/navigation";
import {
  FlowCard,
  IconCloud,
  IconDoc,
  IconGlobe,
  IconImage,
  IconKey,
  IconLock,
  IconPages,
  IconPen,
  IconPlug,
  IconRepo,
  IconUser,
  KeepItem,
  SkipItem,
} from "@/content/privacy-shared";

export function PrivacyZh() {
  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gp-brand text-white shadow-sm">
          <IconLock />
        </span>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">隐私</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">正文不进我们的服务器</h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-neutral-600">
            GitPress.net 是云工具，不是内容站。打开后台时，平台用你授权的 GitHub App{" "}
            <strong className="font-semibold text-neutral-800">向你的仓库读取</strong>
            ；点保存则 <strong className="font-semibold text-neutral-800">写回同一仓库</strong>
            。正文的唯一来源是你的 GitHub，不是我们的 Postgres。
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">只保留</span>
            <h2 className="text-lg font-semibold text-emerald-950">控制面</h2>
          </div>
          <p className="mt-2 text-sm text-emerald-900/70">让后台能登录、能找到你的站。不是稿库。</p>
          <ul className="mt-5 space-y-3">
            <KeepItem icon={<IconUser />} title="登录账号" body="邮箱、显示名、头像。Auth 登录要用。" />
            <KeepItem
              icon={<IconPlug />}
              title="GitHub App 安装映射"
              body="好让后台代表你读写仓库。卸掉授权，这条就断了。"
            />
            <KeepItem
              icon={<IconGlobe />}
              title="站点指针"
              body="站点名、主题名、两个仓库地址、公开 URL 等元数据。"
            />
            <KeepItem
              icon={<IconKey />}
              title="可选：你自己的 AI 密钥"
              body="只有你填了才存。加密存放，数据库里看不到明文。"
            />
          </ul>
        </section>

        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gp-brand px-2.5 py-0.5 text-xs font-semibold text-white">不保存</span>
            <h2 className="text-lg font-semibold text-rose-950">内容</h2>
          </div>
          <p className="mt-2 text-sm text-rose-900/70">这些只住在你的 GitHub。我们没有第二份。</p>
          <ul className="mt-5 space-y-3">
            <SkipItem icon={<IconDoc />} title="文章和页面" body="Markdown 正文与草稿。保存是写进私有数据仓。" />
            <SkipItem icon={<IconImage />} title="媒体文件" body="图片、视频等。同样只在数据仓。" />
            <SkipItem
              icon={<IconPages />}
              title="公开站点的 HTML"
              body="在你的网站仓库 / Pages 上。读者请求不经过 gitpress.net。"
            />
            <SkipItem
              icon={<IconLock />}
              title="授权撤回之后"
              body="卸载 GitHub App 或删掉仓库，我们再也读不到内容。"
            />
          </ul>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">数据走哪</h2>
        <p className="mt-2 text-sm text-neutral-500">四步，没有「上传到 GitPress 再分发」这一环。</p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FlowCard
            icon={<IconPen />}
            color="bg-gp-brand text-white"
            index={1}
            total={4}
            title="你在后台写"
            body="编辑器在 gitpress.net。稿子还没变成「我们的数据」。"
          />
          <FlowCard
            icon={<IconCloud />}
            color="bg-sky-600 text-white"
            index={2}
            total={4}
            title="平台调 GitHub API"
            body="打开后台是读你的仓库；点保存是写回同一仓库。"
          />
          <FlowCard
            icon={<IconRepo />}
            color="bg-emerald-600 text-white"
            index={3}
            total={4}
            title="私有数据仓"
            body="正文、媒体、草稿只住在这里。这是唯一来源。"
          />
          <FlowCard
            icon={<IconPages />}
            color="bg-violet-600 text-white"
            index={4}
            total={4}
            title="公开网站仓 / Pages"
            body="Actions 编出 HTML。读者不经过 gitpress.net。"
          />
        </ol>
      </section>

      <aside className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
        <p className="font-semibold">关于后台那几十秒缓存</p>
        <p className="mt-2 text-amber-900/80">
          为了打开更快，会把刚从 GitHub 读到的列表在边缘缓存几十秒，保存后立刻作废。这不是内容库，也不能在你撤回授权后继续用。
        </p>
      </aside>

      <p className="mt-10 text-sm text-neutral-500">
        三块分别干什么、关停了怎么办，见{" "}
        <Link href="/help/what-is-gitpress" className="underline hover:text-neutral-800">
          这是什么项目？
        </Link>
        。
      </p>
    </>
  );
}
