import { SettingsForm } from "@/components/SettingsForm";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "设置" };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site } = await requireSite(siteId);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-normal text-neutral-800">设置</h1>

      <div className="mt-5 rounded border border-neutral-200 bg-white shadow-sm">
        <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">常规</h2>
        <SettingsForm
          siteId={site.id}
          initial={{
            name: site.name,
            description: site.description ?? "",
            language: site.language,
          }}
        />
      </div>

      <div className="mt-6 rounded border border-neutral-200 bg-white shadow-sm">
        <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">部署</h2>
        <div className="space-y-3 p-5 text-sm leading-relaxed text-neutral-600">
          <p>
            当前地址:
            {site.url ? (
              <a href={site.url} target="_blank" rel="noreferrer" className="ml-1 text-wp-accent hover:underline">
                {site.url}
              </a>
            ) : (
              <span className="ml-1 text-neutral-400">GitHub Pages 启用中…</span>
            )}
          </p>
          <p>
            想使用 <strong>Vercel</strong> 或自定义域名?把公开的网站仓库
            <code className="mx-1 rounded bg-neutral-100 px-1.5 py-0.5">{site.siteRepo}</code>
            导入 Vercel 即可(纯静态,无需任何构建配置);自定义域名解析到 Pages 或 Vercel
            后,在数据仓库的 <code className="mx-1 rounded bg-neutral-100 px-1.5 py-0.5">gitpress.json</code>
            中把 <code>site.url</code> 改为你的域名、<code>site.basePath</code> 改为 <code>/</code>。
            详细步骤见文档。
          </p>
        </div>
      </div>
    </div>
  );
}
