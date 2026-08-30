import Link from "next/link";
import { auth } from "@/auth";
import { QqGroupFloat } from "@/components/QqGroupFloat";
import { ThemePreviewImage } from "@/components/ThemePreviewImage";
import { BUILTIN_THEMES } from "@/lib/themes";

const STEPS = [
  {
    title: "登录并授权 GitHub",
    body: "用 Google 或 GitHub 登录，安装 GitPress App。平台在你的账号下建好私有数据仓和公开网站仓。",
  },
  {
    title: "选主题，开始写作",
    body: "后台是熟悉的仪表盘、文章、媒体、外观。保存即写入你的仓库，不是上传到我们这里。",
  },
  {
    title: "自动上线",
    body: "GitHub Actions 编译，推到公开仓。读者访问 GitHub Pages 或你的域名，请求不经过 gitpress.net。",
  },
];

export default async function LandingPage() {
  const session = await auth();
  const startHref = session?.user ? "/new" : "/login";
  const featuredTheme = BUILTIN_THEMES[0];

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Git<span className="text-gp-brand">Press</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#showcase" className="hidden text-neutral-500 hover:text-neutral-900 sm:inline">
              主题
            </a>
            <Link href="/help" className="hidden text-neutral-500 hover:text-neutral-900 sm:inline">
              帮助
            </Link>
            {session?.user ? (
              <Link
                href="/dashboard"
                className="rounded-md bg-gp-brand px-4 py-2 font-medium text-white hover:opacity-90"
              >
                进入控制台
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-neutral-800 hover:text-neutral-950">
                  登录
                </Link>
                <Link
                  href="/login"
                  className="rounded-md bg-gp-brand px-4 py-2 font-medium text-white hover:opacity-90"
                >
                  免费开始
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-14 sm:pt-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.2] tracking-tight sm:text-5xl">
              <span className="block">用熟悉的后台写博客</span>
              <span className="block">站点在你的 GitHub</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-500">
              免费。读者访问的是你的 GitHub Pages；正文、图片和草稿只在你的私有仓库里，不进我们的数据库。
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href={startHref}
                className="rounded-md bg-gp-brand px-6 py-3 font-semibold text-white hover:opacity-90"
              >
                {session?.user ? "创建新站点" : "免费开始"}
              </Link>
              <a href="#showcase" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
                看看主题
              </a>
            </div>
          </div>

          {featuredTheme && (
            <div className="overflow-hidden rounded-2xl border border-neutral-200">
              <div className="border-b border-neutral-100 px-4 py-2 text-xs text-neutral-400">
                {featuredTheme.displayName} 主题预览
              </div>
              <ThemePreviewImage
                src={featuredTheme.previewSrc}
                alt={`${featuredTheme.displayName} 主题预览`}
                className="h-56 sm:h-72"
              />
            </div>
          )}
        </section>

        <section id="how-it-works" className="border-t border-neutral-100 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-2xl font-semibold tracking-tight">三步上线</h2>
            <ol className="mt-10 grid gap-10 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <p className="text-sm font-medium tabular-nums text-gp-brand">{index + 1}</p>
                  <h3 className="mt-2 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="showcase" className="scroll-mt-20 border-t border-neutral-100 bg-neutral-50 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-2xl font-semibold tracking-tight">内置四套主题</h2>
            <p className="mt-2 max-w-2xl text-neutral-500">
              创建后可随时切换。也可以
              <Link href="/make-theme" className="mx-1 font-medium text-neutral-800 underline decoration-neutral-300 hover:decoration-neutral-800">
                用 AI 做一套
              </Link>
              或在 GitHub 上
              <a
                href="https://github.com/tap6/gitpress"
                className="mx-1 font-medium text-neutral-800 underline decoration-neutral-300 hover:decoration-neutral-800"
                target="_blank"
                rel="noreferrer"
              >
                贡献开源主题
              </a>
              。
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {BUILTIN_THEMES.map((theme) => (
                <figure key={theme.name} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                  <ThemePreviewImage src={theme.previewSrc} alt={theme.displayName} className="h-40" />
                  <figcaption className="p-4">
                    <p className="font-semibold">{theme.displayName}</p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-500">{theme.description}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-100 py-14">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
            <p>
              <span className="font-semibold">正文只在私有仓</span>
              <span className="mt-1 block text-sm leading-relaxed text-neutral-500">
                Markdown、图片、草稿不进 GitPress.net 的数据库。
              </span>
            </p>
            <p>
              <span className="font-semibold">读者不经过本站</span>
              <span className="mt-1 block text-sm leading-relaxed text-neutral-500">
                公开站点在 GitHub Pages 或你的域名上。
              </span>
            </p>
            <p>
              <span className="font-semibold">卸掉 App 就读不到</span>
              <span className="mt-1 block text-sm leading-relaxed text-neutral-500">
                主题 MIT 开源。
                <a href="#privacy" className="ml-1 font-medium text-neutral-800 underline decoration-neutral-300 hover:decoration-neutral-800">
                  详见说明
                </a>
              </span>
            </p>
          </div>
        </section>

        <section id="privacy" className="scroll-mt-20 border-t border-neutral-100 bg-neutral-50 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-2xl font-semibold tracking-tight">我们不托管你的博客内容</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-500">
              打开后台时，平台用你授权的 GitHub App 向你的仓库读取；点保存则写回同一仓库。
              正文的唯一来源是你的 GitHub。写作写入私有数据仓，Actions 构建后推到公开网站仓，再由 Pages 或你的域名提供访问。
            </p>
            <div className="mt-10 grid gap-10 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">我们只保留</h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-500">
                  <li>登录账号：邮箱、显示名、头像。</li>
                  <li>GitHub App 安装映射，好让后台代表你读写仓库。</li>
                  <li>站点指针：站点名、主题名、两个仓库地址、公开 URL。</li>
                  <li>若你配置了 AI：密钥加密存放，数据库里看不到明文。</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold">我们不保存</h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-500">
                  <li>文章、页面的 Markdown 正文与草稿。</li>
                  <li>图片、视频等媒体文件。</li>
                  <li>公开站点的 HTML——在你的网站仓 / Pages 上。</li>
                  <li>卸载 GitHub App 或删掉仓库之后，我们再也读不到你的内容。</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-100 py-16">
          <div className="mx-auto max-w-xl px-6 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">准备好了就写第一篇</h2>
            <p className="mt-3 text-neutral-500">注册免费。站点在你的 GitHub 上，不在我们的服务器上。</p>
            <Link
              href={startHref}
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
          <Link href="/help" className="text-neutral-500 hover:text-neutral-800">
            帮助
          </Link>
          {" · "}
          <Link href="/make-theme" className="text-neutral-500 hover:text-neutral-800">
            做主题
          </Link>
          {" · "}
          <a
            href="https://github.com/tap6/gitpress"
            className="text-neutral-500 hover:text-neutral-800"
            target="_blank"
            rel="noreferrer"
          >
            开源（MIT）
          </a>
        </p>
      </footer>
      <QqGroupFloat />
    </div>
  );
}
