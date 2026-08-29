import Link from "next/link";
import { PagesTable } from "./PagesTable";
import { cachedListPages } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "页面" };

export default async function PagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { siteId } = await params;
  const { saved } = await searchParams;
  const { site, installation } = await requireSite(siteId);
  const pages = await cachedListPages(installation.installationId, site.dataRepo);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-normal text-neutral-800">页面</h1>
        <Link
          href={`/sites/${site.id}/pages/new`}
          className="rounded border border-wp-accent px-3 py-1 text-sm text-wp-accent hover:bg-wp-accent hover:text-white"
        >
          写页面
        </Link>
      </div>

      {saved && (
        <div className="mt-4 rounded border-l-4 border-emerald-500 bg-white p-3 text-sm shadow-sm">
          已保存并提交到数据仓库,网站将在约 1 分钟后更新。
        </div>
      )}

      <PagesTable siteId={site.id} pages={pages} />

      <p className="mt-3 text-xs text-neutral-400">
        页面是站点骨架(关于、联系、隐私等),地址在站点根路径,例如 /about/。文章才会出现在首页和
        RSS。
      </p>
    </div>
  );
}
