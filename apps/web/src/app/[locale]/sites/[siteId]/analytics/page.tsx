import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AnalyticsForm } from "@/components/AnalyticsForm";
import { analyticsProvidersForEditor } from "@/lib/analytics";
import { cachedSiteConfig } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export async function generateMetadata() {
  const t = await getTranslations("analyticsPage");
  return { title: t("title") };
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const t = await getTranslations("analyticsPage");
  const config = await cachedSiteConfig(installation.installationId, site.dataRepo);
  const providers = analyticsProvidersForEditor(
    config?.site.analytics,
    typeof config?.site.analyticsSnippet === "string" ? config.site.analyticsSnippet : "",
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-normal text-neutral-800">{t("title")}</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        {t("leadBefore")}{" "}
        <Link href="/help/analytics" className="text-wp-accent hover:underline">
          {t("leadLink")}
        </Link>
      </p>
      <div className="mt-5 rounded border border-neutral-200 bg-white shadow-sm">
        <AnalyticsForm siteId={site.id} initial={providers} />
      </div>
    </div>
  );
}
