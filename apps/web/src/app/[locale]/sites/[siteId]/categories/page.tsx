import { getTranslations } from "next-intl/server";
import { CategoriesForm } from "@/components/CategoriesForm";
import { cachedSiteCategories } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export async function generateMetadata() {
  const t = await getTranslations("categoriesPage");
  return { title: t("title") };
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const t = await getTranslations("categoriesPage");
  const categories = await cachedSiteCategories(installation.installationId, site.dataRepo);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-normal text-neutral-800">{t("title")}</h1>
      <p className="mt-2 text-sm text-neutral-500">{t("lead")}</p>
      <div className="mt-5 rounded border border-neutral-200 bg-white shadow-sm">
        <CategoriesForm siteId={site.id} initial={categories} />
      </div>
    </div>
  );
}
