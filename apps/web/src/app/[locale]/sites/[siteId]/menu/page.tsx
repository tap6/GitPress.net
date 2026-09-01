import { getTranslations } from "next-intl/server";
import { MenuForm } from "@/components/MenuForm";
import { cachedListPages, cachedSiteCategories, cachedSiteNav } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export async function generateMetadata() {
  const t = await getTranslations("menuPage");
  return { title: t("title") };
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const t = await getTranslations("menuPage");
  const [categories, pages, nav] = await Promise.all([
    cachedSiteCategories(installation.installationId, site.dataRepo),
    cachedListPages(installation.installationId, site.dataRepo, site.language),
    cachedSiteNav(installation.installationId, site.dataRepo),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-normal text-neutral-800">{t("title")}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        {t("lead")}
        {nav === null ? ` ${t("firstOpen")}` : ""}
      </p>
      <div className="mt-5 rounded border border-neutral-200 bg-white shadow-sm">
        <MenuForm
          siteId={site.id}
          initial={nav}
          categories={categories}
          pages={pages}
          language={site.language}
        />
      </div>
    </div>
  );
}
