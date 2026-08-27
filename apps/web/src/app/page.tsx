import Link from "next/link";
import { auth } from "@/auth";

const FEATURES = [
  {
    title: "内容永远是你的",
    body: "文章、图片存在你自己的私有 GitHub 仓库里。草稿永不公开,随时可以带走全部数据。",
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

export default async function LandingPage() {
  const session = await auth();
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <p className="text-xl font-bold tracking-tight">
          Git<span className="text-gp-brand">Press</span>
        </p>
        <nav className="flex items-center gap-4 text-sm">
          <a
            href="https://github.com"
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
        <section className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            像用 WordPress 一样写作,
            <br />
            像 Git 一样拥有一切。
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-500">
            GitPress 在你自己的 GitHub 上创建博客:私有仓库存内容,公开仓库存网站,
            Actions 自动构建,Pages 免费托管。我们不保存你的任何一篇文章。
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href={session?.user ? "/new" : "/login"}
              className="rounded-md bg-gp-brand px-6 py-3 font-semibold text-white hover:opacity-90"
            >
              创建我的博客
            </Link>
            <a
              href="#features"
              className="rounded-md border border-neutral-300 px-6 py-3 font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              了解架构
            </a>
          </div>
        </section>

        <section id="features" className="border-t border-neutral-100 bg-neutral-50 py-16">
          <div className="mx-auto grid max-w-5xl gap-6 px-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-neutral-200 bg-white p-6"
              >
                <h2 className="font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="py-10 text-center text-sm text-neutral-400">
        © {new Date().getFullYear()} GitPress.net · 主题与构建工具开源(MIT)
      </footer>
    </div>
  );
}
