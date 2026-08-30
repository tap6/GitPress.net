import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "怎样看访问量",
  description: "在统计页接入 GA、Clarity、Umami 等。GitPress 不存访客，数字在各家自己的后台看。",
};

export default function AnalyticsHelpPage() {
  return (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">帮助</p>
      <p className="mt-2">
        <Link href="/help" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← 全部帮助
        </Link>
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">怎样看访问量</h1>
      <p className="mt-4 leading-relaxed text-neutral-500">
        GitPress 不内置访客统计,也不把浏览记录存在自己的数据库里。你在侧栏「统计」里接入第三方,数字去对方后台看。
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">配置存在哪</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          写在私有数据仓的 <code className="rounded bg-neutral-100 px-1">gitpress.json</code>
          ,和站点名称、评论区一样。不是 GitPress 的云数据库。关掉「编入网站」后,填写的 ID
          还在,只是下次构建不再往页面插脚本。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">怎么接入</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
          <li>到对应平台创建网站或媒体资源,复制它给的 ID 或脚本。</li>
          <li>回到 GitPress 侧栏「统计」,填进对应卡片,勾选「编入网站」。</li>
          <li>可选:把对方后台的地址贴到「看板链接」,保存后本页顶部可以一键跳转。</li>
          <li>保存。若公开站点上的脚本有变化,会触发一次构建,大约一分钟后生效。</li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">可以接哪些</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
          <li>
            <a href="https://analytics.google.com/" className="text-wp-accent hover:underline" target="_blank" rel="noreferrer">
              Google Analytics
            </a>
            :测量 ID,形如 <code className="rounded bg-neutral-100 px-1">G-xxxxxxxx</code>。
          </li>
          <li>
            <a href="https://clarity.microsoft.com/" className="text-wp-accent hover:underline" target="_blank" rel="noreferrer">
              Microsoft Clarity
            </a>
            :热力图和会话回放,可与流量统计同时开。
          </li>
          <li>
            <a href="https://dash.cloudflare.com/" className="text-wp-accent hover:underline" target="_blank" rel="noreferrer">
              Cloudflare Web Analytics
            </a>
            :beacon token。国内读者可能上报不完整。
          </li>
          <li>
            <a href="https://tongji.baidu.com/" className="text-wp-accent hover:underline" target="_blank" rel="noreferrer">
              百度统计
            </a>
            :复制 hm.js 后面的站点 ID。
          </li>
          <li>
            <a href="https://cloud.umami.is/" className="text-wp-accent hover:underline" target="_blank" rel="noreferrer">
              Umami
            </a>
            :Cloud 或自建。Website ID 是 UUID;自建要改脚本地址。
          </li>
          <li>
            <a href="https://www.51.la/" className="text-wp-accent hover:underline" target="_blank" rel="noreferrer">
              51.LA
            </a>
            :后台的统计 id。
          </li>
          <li>自定义代码可加多条,Plausible、GoatCounter 或其他脚本都走这里。</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">和 GitPress 宕机的关系</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          统计脚本在你已经发布的网站上自行向第三方上报。关掉统计并重新构建后,站点不再请求这些第三方。
          gitpress.net 本身不参与浏览计数;它挂了,已上线的博客照常访问。
        </p>
      </section>
    </>
  );
}
