import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "隐私",
  description:
    "GitPress.net 只保留登录账号和站点指针。文章、图片、草稿和公开 HTML 都在你自己的 GitHub 仓库。",
};

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="16" r="1.4" fill="currentColor" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19.2c1.4-3 4-4.7 7-4.7s5.6 1.7 7 4.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 3.5V9h5.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 13h7M8.5 16.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10.5" r="1.6" fill="currentColor" />
      <path
        d="M4 16.5 9 12l4 3.5 2.5-2 4.5 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 12h17M12 3.5c2.4 2.6 3.6 5.5 3.6 8.5s-1.2 5.9-3.6 8.5c-2.4-2.6-3.6-5.5-3.6-8.5s1.2-5.9 3.6-8.5Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <circle cx="8" cy="14" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M11 14h9v3M17 14v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconPlug() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M8 7V3M16 7V3M7 11h10v4a5 5 0 0 1-10 0v-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 20v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconPen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M4 20h4l11-11-4-4L4 16v4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="m13.5 6.5 4 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconCloud() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M7 18h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.5-1.5A3.5 3.5 0 0 0 7 18Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconRepo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M6 4.5h12A1.5 1.5 0 0 1 19.5 6v12.5a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18.5V6A1.5 1.5 0 0 1 6 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M8 8h8M8 12h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconPages() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 9h16" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="7" cy="7" r="0.8" fill="currentColor" />
      <circle cx="9.5" cy="7" r="0.8" fill="currentColor" />
    </svg>
  );
}

function KeepItem({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3 rounded-lg bg-white/80 p-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">{body}</p>
      </div>
    </li>
  );
}

function SkipItem({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3 rounded-lg bg-white/80 p-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-gp-brand">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">{body}</p>
      </div>
    </li>
  );
}

const FLOW = [
  {
    icon: <IconPen />,
    color: "bg-gp-brand text-white",
    title: "你在后台写",
    body: "编辑器在 gitpress.net。稿子还没变成「我们的数据」。",
  },
  {
    icon: <IconCloud />,
    color: "bg-sky-600 text-white",
    title: "平台调 GitHub API",
    body: "打开后台是读你的仓库；点保存是写回同一仓库。",
  },
  {
    icon: <IconRepo />,
    color: "bg-emerald-600 text-white",
    title: "私有数据仓",
    body: "正文、媒体、草稿只住在这里。这是唯一来源。",
  },
  {
    icon: <IconPages />,
    color: "bg-violet-600 text-white",
    title: "公开网站仓 / Pages",
    body: "Actions 编出 HTML。读者不经过 gitpress.net。",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Git<span className="text-gp-brand">Press</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-neutral-500">
            <Link href="/help/what-is-gitpress" className="hover:text-neutral-900">
              这是什么项目？
            </Link>
            <Link href="/help" className="hover:text-neutral-900">
              帮助
            </Link>
            <Link href="/" className="hover:text-neutral-900">
              返回首页
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gp-brand text-white shadow-sm">
            <IconLock />
          </span>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">隐私</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              正文不进我们的服务器
            </h1>
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
              <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                只保留
              </span>
              <h2 className="text-lg font-semibold text-emerald-950">控制面</h2>
            </div>
            <p className="mt-2 text-sm text-emerald-900/70">让后台能登录、能找到你的站。不是稿库。</p>
            <ul className="mt-5 space-y-3">
              <KeepItem
                icon={<IconUser />}
                title="登录账号"
                body="邮箱、显示名、头像。Auth 登录要用。"
              />
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
              <span className="rounded-full bg-gp-brand px-2.5 py-0.5 text-xs font-semibold text-white">
                不保存
              </span>
              <h2 className="text-lg font-semibold text-rose-950">内容</h2>
            </div>
            <p className="mt-2 text-sm text-rose-900/70">这些只住在你的 GitHub。我们没有第二份。</p>
            <ul className="mt-5 space-y-3">
              <SkipItem
                icon={<IconDoc />}
                title="文章和页面"
                body="Markdown 正文与草稿。保存是写进私有数据仓。"
              />
              <SkipItem
                icon={<IconImage />}
                title="媒体文件"
                body="图片、视频等。同样只在数据仓。"
              />
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
            {FLOW.map((step, index) => (
              <li
                key={step.title}
                className="relative rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${step.color}`}
                >
                  {step.icon}
                </span>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  {index + 1} / 4
                </p>
                <h3 className="mt-1 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{step.body}</p>
              </li>
            ))}
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
      </main>
    </div>
  );
}
