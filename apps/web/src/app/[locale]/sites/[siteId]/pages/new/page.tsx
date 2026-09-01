import { PageEditor } from "@/components/PageEditor";
import { cachedSiteConfig, cachedSiteNav } from "@/lib/siteDataCache";
import { convertUploadsToWebpEnabled } from "@/lib/convertUploadWebp";
import { requireSite } from "@/lib/sites";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("editor");
  return { title: t("newPage") };
}

export default async function NewPagePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const t = await getTranslations("editor");
  const [nav, config] = await Promise.all([
    cachedSiteNav(installation.installationId, site.dataRepo),
    cachedSiteConfig(installation.installationId, site.dataRepo),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mb-5 shrink-0 text-2xl font-normal text-neutral-800">{t("newPage")}</h1>
      <PageEditor
        siteId={siteId}
        hasCustomNav={nav !== null}
        convertUploadsToWebp={convertUploadsToWebpEnabled(config?.site)}
      />
    </div>
  );
}
