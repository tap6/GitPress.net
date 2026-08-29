import type { Metadata } from "next";
import Link from "next/link";
import { GITHUB_PAGES_IPV4, GITHUB_PAGES_IPV6 } from "@/lib/customDomain";

export const metadata: Metadata = {
  title: "绑定自己的域名",
  description:
    "GitPress 可以把域名登记到 GitHub Pages，但解析记录必须你在域名注册商自己添加。GitHub 权限改不了阿里云或 Cloudflare。",
};

export default function CustomDomainHelpPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Git<span className="text-gp-brand">Press</span>
        </Link>
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
          返回首页
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">帮助</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">绑定自己的域名</h1>
        <p className="mt-4 leading-relaxed text-neutral-500">
          默认地址是 <code className="rounded bg-neutral-100 px-1">用户名.github.io/站点名/</code>
          。换成 <code className="rounded bg-neutral-100 px-1">blog.example.com</code>{" "}
          分两步：GitPress 替你在 GitHub 上登记域名，你在买域名的地方添加解析。后一步任何云平台都代劳不了。
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">我们能代做的，和必须你自己做的</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 text-sm leading-relaxed text-emerald-950">
              <p className="font-semibold">GitPress 用 GitHub 权限可以</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>在公开网站仓库登记自定义域名</li>
                <li>写上 CNAME 文件，重建时不会冲掉</li>
                <li>
                  把站点地址改成你的域名，并把路径前缀改成 <code>/</code>
                </li>
                <li>等 DNS 正确后，由 GitHub 签发免费 HTTPS</li>
              </ul>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 text-sm leading-relaxed text-amber-950">
              <p className="font-semibold">GitHub 登录做不到</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>登录阿里云、Cloudflare、Namecheap、GoDaddy</li>
                <li>自动添加 A / AAAA / CNAME 解析</li>
                <li>验证你是否真的拥有这个域名——解析对了，GitHub 才发证书</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">推荐流程</h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-neutral-600">
            <li>买好域名，打开注册商的 DNS 管理页（不要关掉）。</li>
            <li>
              登录 GitPress 后台 → 该站点的<strong>设置</strong> → <strong>自定义域名</strong>
              ，填入主机名（例如 <code className="rounded bg-neutral-100 px-1">blog.example.com</code>
              ），点绑定。
            </li>
            <li>按设置页给出的表格，在注册商添加记录。保存后等解析指向 GitHub。</li>
            <li>
              等 GitHub 签发证书（通常几分钟，偶发数小时）。证书好了再用{" "}
              <code className="rounded bg-neutral-100 px-1">https://你的域名</code> 打开。
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">子域名（推荐）</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            例如 <code className="rounded bg-neutral-100 px-1">blog.example.com</code> 或{" "}
            <code className="rounded bg-neutral-100 px-1">www.example.com</code>。添加一条 CNAME：
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100">{`类型    名称     值
CNAME   blog     你的GitHub用户名.github.io.`}</pre>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            值必须是 <code className="rounded bg-neutral-100 px-1">用户名.github.io</code>
            ，不要带仓库名，末尾的点有的服务商会自动补。Cloudflare 请把该记录设为「仅 DNS / DNS
            only」，不要走橙色云代理，否则 GitHub 很难签发证书。
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">根域名（example.com）</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            根域名不能用 CNAME（DNS 规范），要指到 GitHub Pages 的 Anycast 地址：
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100">{`类型   名称   值
A      @      ${GITHUB_PAGES_IPV4.join("\nA      @      ")}
AAAA   @      ${GITHUB_PAGES_IPV6.join("\nAAAA   @      ")}`}</pre>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            若你的域名是 <code className="rounded bg-neutral-100 px-1">example.co.uk</code>{" "}
            这类多段后缀，设置页可能把它当成子域名；请按注册商文档把根域名做成 A / AAAA，或改用{" "}
            <code className="rounded bg-neutral-100 px-1">www</code>。
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">为什么还要改站点地址？</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            GitHub Pages 项目站默认挂在{" "}
            <code className="rounded bg-neutral-100 px-1">/仓库名/</code>{" "}
            路径下。换成自己的域名后，网站在域名根路径提供服务。后台绑定域名时会自动把数据仓库{" "}
            <code className="rounded bg-neutral-100 px-1">gitpress.json</code> 里的{" "}
            <code className="rounded bg-neutral-100 px-1">site.url</code> 和{" "}
            <code className="rounded bg-neutral-100 px-1">site.basePath</code>{" "}
            改掉并触发重建，否则样式和链接会指向错误路径。
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">想用 Vercel 托管也可以</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            公开网站仓库是纯静态文件。在 Vercel 导入该仓库（不是{" "}
            <code className="rounded bg-neutral-100 px-1">-data</code>{" "}
            仓库），Framework 选 Other，构建命令留空，输出目录填{" "}
            <code className="rounded bg-neutral-100 px-1">.</code>
            。域名在 Vercel 后台添加，DNS 按 Vercel 提示走。GitPress 的「绑定到 GitHub
            Pages」不适用于这条路径，请不要两边同时指同一个域名。
          </p>
        </section>

        <p className="mt-12 text-sm text-neutral-500">
          已经有站点？打开后台{" "}
          <Link href="/dashboard" className="text-wp-accent hover:underline">
            设置 → 自定义域名
          </Link>
          。
        </p>
      </main>
    </div>
  );
}
