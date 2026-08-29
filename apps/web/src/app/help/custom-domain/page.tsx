import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "绑定自己的域名",
  description: "在后台填域名，再去买域名的网站加一条解析。三步就能换成自己的地址。",
};

export default function CustomDomainHelpPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Git<span className="text-gp-brand">Press</span>
        </Link>
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
          返回首页
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-20">
        <p className="text-sm font-medium text-gp-brand">帮助</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">用自己的域名打开博客</h1>
        <p className="mt-4 text-lg leading-relaxed text-neutral-600">
          现在地址大概是一长串 github.io。想改成{" "}
          <span className="whitespace-nowrap font-medium text-neutral-800">blog.你的域名</span>
          ，做两件事就行：后台填一下，再去买域名的网站加一条记录。
        </p>

        <ol className="mt-10 space-y-8">
          <li>
            <p className="text-sm font-semibold text-gp-brand">第 1 步</p>
            <h2 className="mt-1 text-xl font-semibold">准备好域名</h2>
            <p className="mt-2 leading-relaxed text-neutral-600">
              没有的话，在阿里云、腾讯云、Cloudflare 等任意商家买一个。建议用{" "}
              <span className="font-medium text-neutral-800">blog.你买的域名</span>
              ，比光秃秃的根域名更好填。
            </p>
          </li>
          <li>
            <p className="text-sm font-semibold text-gp-brand">第 2 步</p>
            <h2 className="mt-1 text-xl font-semibold">在 GitPress 里填上</h2>
            <p className="mt-2 leading-relaxed text-neutral-600">
              登录后台，打开这个站点的「设置」，找到「自定义域名」，填入例如{" "}
              <code className="rounded bg-neutral-100 px-1">blog.example.com</code>，点绑定。
            </p>
            <p className="mt-2 leading-relaxed text-neutral-600">
              这一步我们会帮你告诉 GitHub：以后用这个名字来访问你的博客。
            </p>
          </li>
          <li>
            <p className="text-sm font-semibold text-gp-brand">第 3 步</p>
            <h2 className="mt-1 text-xl font-semibold">按表格去商家加记录</h2>
            <p className="mt-2 leading-relaxed text-neutral-600">
              绑定后，设置页会出现一张小表（类型、名称、值）。打开买域名的网站，找到「解析 / DNS」，照着表加进去。保存后等几分钟，用{" "}
              <span className="whitespace-nowrap">https://你的域名</span> 打开即可。
            </p>
            <p className="mt-2 leading-relaxed text-neutral-600">
              这一步只能你自己做：商家只认账号主人，我们进不去。
            </p>
          </li>
        </ol>

        <section className="mt-12 rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-sm leading-relaxed text-neutral-600">
          <h2 className="text-base font-semibold text-neutral-800">卡住了？</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>刚加完记录打不开：再等 10 分钟。证书有时会慢一点。</li>
            <li>用了 Cloudflare：把那条记录的小橙云关掉，选「仅 DNS」。</li>
            <li>想用光秃秃的 example.com：也可以，设置页表格会多几行，照填就行。</li>
            <li>网站是在 Vercel 上：请到 Vercel 里添加域名，不要在 GitPress 这里绑。</li>
          </ul>
        </section>

        <p className="mt-10">
          <Link
            href="/dashboard"
            className="inline-block rounded-md bg-gp-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            去后台绑定
          </Link>
        </p>
      </main>
    </div>
  );
}
