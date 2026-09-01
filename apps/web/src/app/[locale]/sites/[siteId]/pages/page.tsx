import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { PagesTable } from "./PagesTable";
import { cachedListPages } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export async function generateMetadata() {
  const t = await getTranslations("pages");
  return { title: t("title") };
}

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
  const t = await getTranslations("pages");
  const pages = await cachedListPages(installation.installationId, site.dataRepo, site.language);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-normal text-neutral-800">{t("title")}</h1>
        <Link
          href={`/sites/${site.id}/pages/new`}
          className="rounded border border-wp-accent px-3 py-1 text-sm text-wp-accent hover:bg-wp-accent hover:text-white"
        >
          {t("write")}
        </Link>
      </div>

      {saved && (
        <div className="mt-4 rounded border-l-4 border-emerald-500 bg-white p-3 text-sm shadow-sm">
          {t("saved")}
        </div>
      )}

      <PagesTable siteId={site.id} pages={pages} />

      <p className="mt-3 text-xs text-neutral-400">{t("footnote")}</p>
    </div>
  );
}
