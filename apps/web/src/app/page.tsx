import Link from "next/link";
import { auth } from "@/auth";
import { QqGroupFloat } from "@/components/QqGroupFloat";
import { formatStatCount, getPublicPlatformStats } from "@/lib/publicStats";

const PLATFORM_REPO = "https://github.com/tap6/GitPress.net";
const GITPRESS_REPO = "https://github.com/tap6/gitpress";
const BUILD_ACTION_REPO = "https://github.com/tap6/build-action";

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

const FEATURES = [
  {
    title: "内容永远是你的",
    body: "文章、图片、草稿只在你的私有 GitHub 仓库。GitPress.net 不建内容库,卸掉 App 授权后我们就读不到你的正文。",
  },
  {
    title: "双仓库架构",
    body: "数据仓库存内容,网站仓库存编译产物。换主题只改配置,一个字都不会丢。",
  },
  {
    title: "零服务器构建",
    body: "GitHub Actions 自动编译,GitHub Pages 或 Vercel 免费托管,没有跑不动的一天。",
  },
  {
    title: "熟悉的后台",
    body: "WordPress 风格的管理界面:仪表盘、文章、媒体、外观、设置,几乎零学习成本。",
  },
];

const STEPS = [
  {
    title: "登录并授权 GitHub",
    body: "用 Google、GitHub 等快捷登录,安装 GitPress App,让平台帮你在 GitHub 上建仓。",
  },
  {
    title: "选主题,开始写作",
    body: "填写站点信息,挑选内置 Astro 主题,在后台写文章、传媒体、管理分类。",
  },
  {
    title: "自动构建,上线访问",
    body: "每次保存都会触发 Actions 构建,编译产物推送到公开网站仓库,Pages 立刻可访问。",
  },
];

export default async function LandingPage() {
  const [session, stats] = await Promise.all([auth(), getPublicPlatformStats()]);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-5">
        <p className="text-xl font-bold tracking-tight">
          Git<span className="text-gp-brand">Press</span>
        </p>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/privacy" className="text-neutral-500 hover:text-neutral-900">
            隐私
          </Link>
          <Link href="/help" className="text-neutral-500 hover:text-neutral-900">
            帮助
          </Link>
          <a href="#open-source" className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900">
            <GitHubMark className="h-4 w-4" />
            源码
          </a>
          {session?.user ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700"
            >
              进入控制台
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700"
            >
              登录 / 注册
            </Link>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 pb-14 pt-16 text-center sm:pt-20">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">
            云工具,不是内容站
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            像用 WordPress 一样写作。
            <br />
            文章不进我们的服务器。
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-500">
            GitPress.net 只是帮你在 GitHub 上建仓、写稿、触发构建的云工具。
            Markdown、图片、草稿都在你自己的仓库里;我们的数据库不保存正文。
            读者访问的是你的 GitHub Pages,请求不会经过 gitpress.net。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={session?.user ? "/new" : "/login"}
              className="rounded-md bg-gp-brand px-6 py-3 font-semibold text-white hover:opacity-90"
            >
              创建我的博客
            </Link>
            <Link
              href="/help/what-is-gitpress"
              className="rounded-md border border-neutral-300 px-6 py-3 font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              这是什么项目？
            </Link>
            <a
              href="#open-source"
              className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-6 py-3 font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <GitHubMark className="h-4 w-4" />
              源码怎么保证
            </a>
          </div>
          <p className="mt-12 text-sm text-neutral-500">
            平台公开统计 · 每 5 分钟更新 · 仅展示汇总数字,不含任何个人信息
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "注册用户", value: stats.users },
              { label: "已创建站点", value: stats.sites },
              { label: "GitHub 已连接", value: stats.githubConnections },
              { label: "内置主题", value: stats.themes },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-5 text-center shadow-sm"
              >
                <dt className="text-xs text-neutral-400">{item.label}</dt>
                <dd className="mt-2 text-3xl font-light tabular-nums text-neutral-900">
                  {formatStatCount(item.value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          id="open-source"
          className="scroll-mt-8 border-y border-neutral-200 bg-neutral-50 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">源码 · 退出权</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
              即便 GitPress.net 关停，
              <br />
              博客仍在你的仓库里。
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-neutral-600">
              文章、图片、草稿从来没进我们的数据库。主题和构建工具 MIT 开源，编译跑在 GitHub
              Actions 上，不经过我们的机器。控制面源码公开（PolyForm Shield）：可以自己部署给自己用，不能拿去开另一个面向大家的平台。平台哪天不在了，用同一份仓库、同一套 Action 继续编、继续挂。不是搬家，是本来就在你这边。
            </p>
            <div className="mt-10 grid gap-4">
              <a
                href={PLATFORM_REPO}
                className="group rounded-2xl bg-gp-brand p-7 text-white shadow-md hover:opacity-95 sm:p-8"
                target="_blank"
                rel="noreferrer"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">主仓库 · 你每天点的网站</p>
                <p className="mt-3 inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  <GitHubMark className="h-7 w-7" />
                  tap6/GitPress.net
                </p>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/90">
                  WordPress 式后台：登录、建仓、写稿、点保存。这是控制面本身，不是你的文章库。源码公开，PolyForm Shield。
                </p>
                <p className="mt-5 text-sm font-semibold text-white group-hover:underline">在 GitHub 打开 →</p>
              </a>
              <div className="grid gap-4 md:grid-cols-2">
                <a
                  href={GITPRESS_REPO}
                  className="group rounded-2xl border border-sky-200 bg-white p-6 shadow-sm hover:border-sky-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">主题与约定</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-xl font-semibold text-neutral-900">
                    <GitHubMark className="h-5 w-5" />
                    tap6/gitpress
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    博客长什么样、Markdown 怎么写、数据仓模板。换主题或自己做主题，都认这份 spec。
                  </p>
                  <p className="mt-4 text-sm font-medium text-sky-800 group-hover:underline">在 GitHub 打开 →</p>
                </a>
                <a
                  href={BUILD_ACTION_REPO}
                  className="group rounded-2xl border border-violet-200 bg-white p-6 shadow-sm hover:border-violet-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">编译</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-xl font-semibold text-neutral-900">
                    <GitHubMark className="h-5 w-5" />
                    tap6/build-action
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    从私有数据仓读内容，编成静态站，推进公开网站仓。你自己的 Actions 里也能跑同一份。
                  </p>
                  <p className="mt-4 text-sm font-medium text-violet-800 group-hover:underline">在 GitHub 打开 →</p>
                </a>
              </div>
            </div>
            <p className="mt-8 text-sm text-neutral-500">
              三块分别干什么，见{" "}
              <Link href="/help/what-is-gitpress" className="font-medium text-neutral-800 underline hover:text-neutral-950">
                这是什么项目？
              </Link>
              。控制面留了什么，见{" "}
              <Link href="/privacy" className="font-medium text-neutral-800 underline hover:text-neutral-950">
                隐私
              </Link>
              。
            </p>
          </div>
        </section>

        <section id="how-it-works" className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold">三步上线</h2>
              <p className="mt-2 text-neutral-500">
                不需要自己配服务器、装数据库、维护 WordPress 插件——GitHub 就是你的后端。
              </p>
            </div>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-neutral-100 bg-neutral-950 py-16 text-neutral-100">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold">双仓库,职责清晰</h2>
              <p className="mt-3 leading-relaxed text-neutral-400">
                内容和网站彻底分离:你在后台写的每一篇文章、每一张图,都进私有数据仓库;
                只有编译后的 HTML/CSS/静态资源才会进入公开网站仓库,供 Pages 托管。
              </p>
              <ul className="mt-6 space-y-3 text-sm text-neutral-300">
                <li>
                  <span className="text-white">数据仓库(私有)</span> — content/、media/、gitpress.json
                </li>
                <li>
                  <span className="text-white">网站仓库(公开)</span> — Astro 编译产物,可随时换主题重建
                </li>
                <li>
                  <span className="text-white">GitHub Actions</span> — push 触发构建,平台服务器零负载
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 font-mono text-xs leading-6 text-neutral-300">
              <p className="text-neutral-500"># 典型站点结构</p>
              <p>alice-blog-data/ &nbsp;← 私有,含草稿</p>
              <p className="pl-4">content/posts/*.md</p>
              <p className="pl-4">media/*.jpg · *.mp4</p>
              <p className="pl-4">gitpress.json</p>
              <p className="mt-3">alice-blog/ &nbsp;← 公开,仅编译结果</p>
              <p className="pl-4">index.html · posts/ · media/</p>
              <p className="mt-4 text-emerald-400/90">→ GitHub Pages / 自定义域名</p>
            </div>
          </div>
        </section>

        <section id="features" className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-2xl font-semibold">为什么选 GitPress</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-100 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold">用 AI 做自己的主题</h2>
              <p className="mt-2 text-neutral-500">
                不需要会写一整套设计系统。复制我们准备好的第一条提示词,让你的 AI 先向你提问,再生成一份 GitPress 能直接导入的 Astro 主题。
              </p>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                { title: "复制提示词", body: "打开帮助里的「用 AI 做主题」，把完整提示词作为和 AI 的第一条消息发出去。" },
                { title: "回答问题", body: "AI 会问风格、布局、Logo、要暴露哪些选项。你答完它才开始写代码。" },
                { title: "导入使用", body: "把主题推到公开 GitHub 仓库,在后台「外观」粘贴 URL 即可启用。商店即将上线。" },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{item.body}</p>
                </div>
              ))}
            </div>
            <Link
              href="/help/make-theme"
              className="mt-8 inline-block rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              查看教程与提示词
            </Link>
          </div>
        </section>

        <section className="border-t border-neutral-100 bg-neutral-50 py-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-2xl font-semibold">准备好拥有自己的博客了吗?</h2>
            <p className="mt-3 text-neutral-500">
              注册免费。正文在你的 GitHub 里,不在 GitPress.net 的服务器上。已有 {formatStatCount(stats.users)} 位用户、
              {formatStatCount(stats.sites)} 个站点在使用。
            </p>
            <Link
              href={session?.user ? "/new" : "/login"}
              className="mt-6 inline-block rounded-md bg-gp-brand px-8 py-3 font-semibold text-white hover:opacity-90"
            >
              {session?.user ? "创建新站点" : "免费开始"}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-100 py-10 text-center text-sm text-neutral-400">
        <p>© {new Date().getFullYear()} GitPress.net</p>
        <p className="mt-1">
            <Link href="/privacy" className="text-neutral-500 hover:text-neutral-800">
              隐私
            </Link>
            {" · "}
            <Link href="/help" className="text-neutral-500 hover:text-neutral-800">
              帮助
            </Link>
            {" · "}
            <Link href="/help/what-is-gitpress" className="text-neutral-500 hover:text-neutral-800">
              这是什么项目？
            </Link>
            {" · "}
            <a href="#open-source" className="text-neutral-500 hover:text-neutral-800">
              源码与许可
            </a>
        </p>
      </footer>
      <QqGroupFloat />
    </div>
  );
}
