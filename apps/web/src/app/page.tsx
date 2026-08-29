import Link from "next/link";
import { auth } from "@/auth";
import { QqGroupFloat } from "@/components/QqGroupFloat";
import { formatStatCount, getPublicPlatformStats } from "@/lib/publicStats";

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
          <a href="#privacy" className="text-neutral-500 hover:text-neutral-900">
            隐私
          </a>
          <Link href="/help/custom-domain" className="text-neutral-500 hover:text-neutral-900">
            用自己的域名
          </Link>
          <Link href="/make-theme" className="text-neutral-500 hover:text-neutral-900">
            做主题
          </Link>
          <a
            href="https://github.com/tap6/gitpress"
            className="text-neutral-500 hover:text-neutral-900"
            target="_blank"
            rel="noreferrer"
          >
            开源主题
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
            <a
              href="#privacy"
              className="rounded-md border border-neutral-300 px-6 py-3 font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              我们留了什么、没留什么
            </a>
          </div>
        </section>

        <section id="privacy" className="scroll-mt-8 border-y border-neutral-800 bg-neutral-950 py-16 text-neutral-100">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">隐私 · 重中之重</p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">GitPress.net 不托管你的博客内容</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-neutral-400">
              打开后台时,平台用你授权的 GitHub App
              <strong className="font-medium text-neutral-200">向你的仓库读取</strong>
              ;点保存则<strong className="font-medium text-neutral-200">写回同一仓库</strong>
              。这是云工具在替你操作 GitHub,不是把文章上传到 GitPress 再分发。
              正文的唯一来源是你的 GitHub,不是我们的 Postgres。
            </p>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-sm font-semibold tracking-wide text-emerald-400">我们只保留(控制面)</h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-300">
                  <li>登录账号:邮箱、显示名、头像(Auth 登录用)。</li>
                  <li>GitHub App 安装映射:好让后台代表你读写仓库。</li>
                  <li>站点指针:站点名、主题名、两个仓库地址、公开 URL 等元数据。</li>
                  <li>若你配置了 AI:密钥加密存放,数据库里看不到明文。</li>
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-sm font-semibold tracking-wide text-gp-brand">我们不保存(内容)</h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-300">
                  <li>文章、页面的 Markdown 正文与草稿。</li>
                  <li>图片、视频等媒体文件。</li>
                  <li>公开站点的 HTML——那在你的网站仓库 / Pages 上,读者不经过 gitpress.net。</li>
                  <li>卸载 GitHub App 或删掉仓库之后,我们再也读不到你的内容。</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-white/10 bg-black/40 p-6 font-mono text-xs leading-7 text-neutral-300 sm:text-sm">
              <p className="text-neutral-500"># 数据走哪</p>
              <p>你在后台写作 → GitPress.net 调用 GitHub API → 私有数据仓(正文、媒体、草稿)</p>
              <p>保存触发 Actions → 公开网站仓(只有编译结果) → GitHub Pages / 你的域名</p>
              <p className="mt-3 text-neutral-500">
                后台为了打开更快,会把刚从 GitHub 读到的列表在边缘缓存几十秒,保存后立刻作废。
                这不是内容库,也不能在你撤回授权后继续用。
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-neutral-100 bg-neutral-50 py-10">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-center text-sm text-neutral-500">
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
                { title: "复制提示词", body: "打开「做主题」页,把完整提示词作为和 AI 的第一条消息发出去。" },
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
              href="/make-theme"
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
            <a href="#privacy" className="text-neutral-500 hover:text-neutral-800">
              隐私
            </a>
            {" · "}
            <Link href="/help/custom-domain" className="text-neutral-500 hover:text-neutral-800">
              用自己的域名
            </Link>
            {" · "}
            <Link href="/make-theme" className="text-neutral-500 hover:text-neutral-800">
              做主题
            </Link>
            {" · "}
            主题与构建工具{" "}
          <a
            href="https://github.com/tap6/gitpress"
            className="text-neutral-500 hover:text-neutral-800"
            target="_blank"
            rel="noreferrer"
          >
            开源(MIT)
          </a>
        </p>
      </footer>
      <QqGroupFloat />
    </div>
  );
}
