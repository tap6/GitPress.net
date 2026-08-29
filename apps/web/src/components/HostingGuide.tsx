"use client";

import type { ReactNode } from "react";
import { GITHUB_PAGES_IPV4, GITHUB_PAGES_IPV6 } from "@/lib/customDomain";

export type HostingKind = "pages" | "vercel" | "cloudflare" | "other";

export const HOSTING_OPTIONS: { id: HostingKind; label: string; badge?: string }[] = [
  { id: "pages", label: "GitHub Pages", badge: "默认" },
  { id: "vercel", label: "Vercel" },
  { id: "cloudflare", label: "Cloudflare" },
  { id: "other", label: "其他" },
];

export function isHostingKind(value: string | null | undefined): value is HostingKind {
  return value === "pages" || value === "vercel" || value === "cloudflare" || value === "other";
}

const code = "rounded bg-black/[0.06] px-1 py-px font-mono text-[0.9em] text-neutral-800";
const markAmber = "rounded bg-amber-200 px-1 py-px font-medium text-amber-950";
const markSky = "rounded bg-sky-200 px-1 py-px font-medium text-sky-950";

export function HostingOptionButtons({
  value,
  onChange,
  label = "托管方式",
}: {
  value: HostingKind;
  onChange: (next: HostingKind) => void;
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {HOSTING_OPTIONS.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.id)}
            className={
              selected
                ? "rounded-lg border-2 border-sky-500 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-950"
                : "rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50"
            }
          >
            {opt.label}
            {opt.badge ? (
              <span className={selected ? "ml-1.5 text-[10px] font-normal text-sky-700" : "ml-1.5 text-[10px] font-normal text-neutral-400"}>
                {opt.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function Callout({
  tone,
  title,
  children,
}: {
  tone: "amber" | "sky" | "rose" | "emerald";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    sky: "border-sky-200 bg-sky-50 text-sky-950",
    rose: "border-rose-200 bg-rose-50 text-rose-950",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${styles[tone]}`}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}

export function DnsTable({ rows }: { rows: { type: string; name: string; value: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-500">
          <tr>
            <th className="px-3 py-2 font-medium">类型</th>
            <th className="px-3 py-2 font-medium">主机记录</th>
            <th className="px-3 py-2 font-medium">值</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs text-neutral-800">
          {rows.map((row) => (
            <tr key={`${row.type}-${row.name}-${row.value}`} className="border-t border-neutral-100">
              <td className="px-3 py-2">{row.type}</td>
              <td className="px-3 py-2">{row.name}</td>
              <td className="break-all px-3 py-2">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StepList({ children }: { children: ReactNode }) {
  return <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-neutral-700">{children}</ol>;
}

export function HostingWhyNotes() {
  return (
    <div className="space-y-3">
      <Callout tone="amber" title="① 先告诉 GitPress 新地址">
        网页里的链接、图片、样式路径是<strong>编译时写进去的</strong>。你用{" "}
        <mark className={markAmber}>example.com</mark> 打开站点，就要在设置里填这个地址（二级、多级同理，填访客实际打开的那个名字）。
        只改 DNS、不填这里：页面也许能打开，图片和 CSS 还会指向旧的 github.io。
      </Callout>
      <Callout tone="sky" title="② 域名加在托管商那边">
        编译好的网页在公开的 <mark className={markSky}>网站仓库</mark>
        里（不是带 <code className={code}>-data</code> 的那个）。接到哪家静态托管，就去哪家控制台添加域名。
        GitPress 不会替你管 Cloudflare / Vercel 的解析。点下面的按钮看对应步骤。
      </Callout>
    </div>
  );
}

export function DomainKindNotes() {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">你想用的地址</th>
              <th className="px-3 py-2 font-medium">怎么叫</th>
              <th className="px-3 py-2 font-medium">设置里填</th>
            </tr>
          </thead>
          <tbody className="text-neutral-700">
            <tr className="border-t border-neutral-100 bg-emerald-50/70">
              <td className="px-3 py-2 font-mono text-xs">example.com</td>
              <td className="px-3 py-2">
                <span className="font-medium text-emerald-900">一级域名（推荐）</span>
                <span className="mt-0.5 block text-xs text-neutral-500">买来直接当网站地址</span>
              </td>
              <td className="px-3 py-2 font-mono text-xs">example.com</td>
            </tr>
            <tr className="border-t border-neutral-100">
              <td className="px-3 py-2 font-mono text-xs">blog.example.com</td>
              <td className="px-3 py-2">
                二级域名
                <span className="mt-0.5 block text-xs text-neutral-500">在一级前面加一段，www 也算</span>
              </td>
              <td className="px-3 py-2 font-mono text-xs">blog.example.com</td>
            </tr>
            <tr className="border-t border-neutral-100">
              <td className="px-3 py-2 font-mono text-xs">docs.blog.example.com</td>
              <td className="px-3 py-2">
                多级域名
                <span className="mt-0.5 block text-xs text-neutral-500">再往前加前缀，用法相同</span>
              </td>
              <td className="px-3 py-2 font-mono text-xs">docs.blog.example.com</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Callout tone="sky" title="多个站点，各自用各自的一级域名">
        站点 A 用 <code className={code}>example.com</code>，站点 B 用{" "}
        <code className={code}>another.com</code>。挂在 GitHub Pages 上时，两条解析的「值」可以完全一样（都指到 Pages）。
        GitHub 看的是<strong>这个名字登记在哪一个网站仓库</strong>，不是靠仓库名写进 DNS。
        <mark className={markAmber}>不要把仓库名写进解析记录</mark>。
      </Callout>
    </div>
  );
}

export function HostingSteps({
  host,
  variant,
  siteRepo,
  pagesDns,
}: {
  host: HostingKind;
  variant: "help" | "settings";
  siteRepo?: string;
  pagesDns?: ReactNode;
}) {
  const repoLink = siteRepo ? (
    <a
      href={`https://github.com/${siteRepo}`}
      target="_blank"
      rel="noreferrer"
      className="break-all font-medium text-wp-accent hover:underline"
    >
      {siteRepo}
    </a>
  ) : (
    <span className="font-medium text-neutral-800">网站仓库</span>
  );
  const inSettings = variant === "settings";

  if (host === "pages") {
    return (
      <div>
        <p className="text-sm text-neutral-500">
          继续用建站时默认的 GitHub Pages。GitPress 可以帮你向 GitHub 登记域名。
        </p>
        <StepList>
          {inSettings ? (
            <li>
              填访客地址（多数人填 <code className={code}>example.com</code>），点保存。我们会向 GitHub Pages
              登记，并触发重建。
            </li>
          ) : (
            <li>
              后台 → 设置 → 访问地址，点 <strong>GitHub Pages</strong>，填访客地址（多数人填{" "}
              <code className={code}>example.com</code>），保存。
            </li>
          )}
          <li>到域名解析商按表格加记录。一级域名和二级、多级写法不一样。</li>
        </StepList>
        {pagesDns ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-neutral-600">下表按你已登记的域名生成。</p>
            {pagesDns}
          </div>
        ) : (
          <PagesDnsGuide />
        )}
        <div className="mt-3">
          <Callout tone="amber" title="Cloudflare 必须灰云">
            若解析开在 Cloudflare，指向 Pages 的记录必须{" "}
            <mark className={markAmber}>DNS only（灰云）</mark>。开橙色代理时 GitHub 签不了证书。
          </Callout>
        </div>
      </div>
    );
  }

  if (host === "vercel") {
    return (
      <div>
        <p className="text-sm text-neutral-500">把同一份静态网页接到 Vercel，域名在 Vercel 控制台添加。</p>
        <StepList>
          <li>
            打开 Vercel，Import 公开的 {repoLink}。
            <mark className={markAmber}>不要导入带 -data 的仓库</mark>，那是文章私仓。
          </li>
          <li>
            Framework 选 Other，Build Command 留空，Output Directory 填 <code className={code}>.</code>
            。仓库里已经是网页文件，<mark className={markSky}>不要再跑一遍构建</mark>。
          </li>
          <li>
            项目 Settings → Domains 添加你的域名。一级域名按 Vercel 给的 ALIAS / A 记录加；二级、多级一般是 CNAME 到{" "}
            <code className={code}>cname.vercel-dns.com</code>。
          </li>
          {inSettings ? (
            <li>回到本页填同一访客地址并保存。保存时会取消 GitHub Pages 上的域名登记。</li>
          ) : (
            <li>
              回 GitPress 设置，点 <strong>Vercel</strong>，填同一地址并保存。
            </li>
          )}
        </StepList>
        <Callout tone="rose" title="不要两边同时挂">
          同一个域名不能同时指到 Pages 和 Vercel。GitPress 里选 Vercel 并保存，会取消 Pages 登记；也可以先单独取消登记，再去 Vercel 添加域名。
        </Callout>
      </div>
    );
  }

  if (host === "cloudflare") {
    return (
      <div>
        <p className="text-sm text-neutral-500">接到 Cloudflare Pages。证书和 DNS 都由 Cloudflare 处理。</p>
        <StepList>
          <li>
            Cloudflare Dashboard → Workers &amp; Pages，接入 {repoLink}。构建同样关掉（或输出目录为仓库根）。
          </li>
          <li>
            Custom domains 添加一级、二级或多级都可以，DNS 用 Cloudflare 生成的记录。这里可以开橙色云，证书由 Cloudflare 签发。
          </li>
          {inSettings ? (
            <li>回到本页填同一访客地址并保存。不要选 GitHub Pages；保存时会取消 Pages 上的登记。</li>
          ) : (
            <li>
              回 GitPress 设置，点 <strong>Cloudflare</strong>，填同一地址并保存。
            </li>
          )}
        </StepList>
        <Callout tone="rose" title="不要两边同时挂">
          Cloudflare 可以开代理；GitHub Pages 不行。同一个 hostname 只留一家。选 Cloudflare 保存会取消 Pages 登记。
        </Callout>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-neutral-500">
        Netlify、自己的 Nginx、对象存储 + CDN 都可以。原则一样：托管静态文件的那家负责域名。
      </p>
      <StepList>
        <li>把 {repoLink} 部署到你的静态托管（同样不要用 -data 仓库）。</li>
        <li>按那家文档添加域名、写 DNS、等证书。</li>
        {inSettings ? (
          <li>回到本页填访客会打开的完整地址并保存。</li>
        ) : (
          <li>
            回 GitPress 设置，点 <strong>其他</strong>，填同一地址并保存。
          </li>
        )}
      </StepList>
    </div>
  );
}

function PagesDnsGuide() {
  const pagesTarget = "<github用户名>.github.io";
  return (
    <div className="mt-3 space-y-5">
      <div>
        <p className="text-sm font-medium text-neutral-800">一级域名（推荐）</p>
        <p className="mt-1 text-sm text-neutral-600">
          主机记录填 <code className={code}>@</code>。多数解析商<strong>不允许</strong>给一级域名做 CNAME，要用 A / AAAA
          指到 GitHub Pages：
        </p>
        <div className="mt-2">
          <DnsTable
            rows={[
              ...GITHUB_PAGES_IPV4.map((value) => ({ type: "A", name: "@", value })),
              ...GITHUB_PAGES_IPV6.map((value) => ({ type: "AAAA", name: "@", value })),
            ]}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-800">二级、多级域名</p>
        <p className="mt-1 text-sm text-neutral-600">
          一条 CNAME 即可。主机记录填「一级域名前面的那些前缀」，值填{" "}
          <code className={code}>{pagesTarget}</code>，
          <mark className={markAmber}>不要带仓库名</mark>。
        </p>
        <div className="mt-2">
          <DnsTable
            rows={[
              { type: "CNAME", name: "blog", value: pagesTarget },
              { type: "CNAME", name: "www", value: pagesTarget },
              { type: "CNAME", name: "docs.blog", value: pagesTarget },
            ]}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          对应 <code className={code}>blog.example.com</code>、<code className={code}>www.example.com</code>、
          <code className={code}>docs.blog.example.com</code>。自查：{" "}
          <code className={code}>dig +short CNAME blog.example.com</code>
        </p>
      </div>
    </div>
  );
}

export function HostingPitfalls() {
  return (
    <div className="space-y-3">
      <Callout tone="amber" title="只改了 DNS，没改访客地址">
        页面能打开，但资源仍指向 <code className={code}>/仓库名/...</code>。回到设置填域名并保存，等这次构建跑完。
      </Callout>
      <Callout tone="rose" title="一级域名写成了 CNAME">
        多数解析商不允许给 <code className={code}>@</code> 做 CNAME。一级域名用 A / AAAA；二级、多级才用 CNAME。
      </Callout>
      <Callout tone="rose" title="Pages 和另一家抢同一个名字">
        先在设置里取消 Pages 登记，再在 Vercel / Cloudflare 添加。两个 GitPress 站点也不要登记同一个域名。
      </Callout>
      <Callout tone="sky" title="DNS 已经指对，站点还是 404">
        多半是这次重建还没跑完。去数据仓库的 Actions 看 GitPress Build 是否成功。
      </Callout>
    </div>
  );
}
