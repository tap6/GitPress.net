import { AnalyticsForm } from "@/components/AnalyticsForm";
import { analyticsProvidersForEditor } from "@/lib/analytics";
import { cachedSiteConfig } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "统计" };

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const config = await cachedSiteConfig(installation.installationId, site.dataRepo);
  const providers = analyticsProvidersForEditor(
    config?.site.analytics,
    typeof config?.site.analyticsSnippet === "string" ? config.site.analyticsSnippet : "",
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-normal text-neutral-800">统计</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        GitPress 不存访客、不画自己的报表。配置写在你的私有数据仓里；只有勾了「编入网站」的项才会插入页面。
        关掉之后填写的内容仍在，只是下次构建不再带脚本。看数字请到各家自己的后台。说明见{" "}
        <a href="/help/analytics" className="text-wp-accent hover:underline">
          怎样看访问量
        </a>
        。
      </p>
      <div className="mt-5 rounded border border-neutral-200 bg-white shadow-sm">
        <AnalyticsForm siteId={site.id} initial={providers} />
      </div>
    </div>
  );
}
