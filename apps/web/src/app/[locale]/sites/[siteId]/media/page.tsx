import { getTranslations } from "next-intl/server";
import { MediaGrid } from "@/components/MediaGrid";
import { MediaUploadForm } from "@/components/MediaUploadForm";
import { convertUploadsToWebpEnabled } from "@/lib/convertUploadWebp";
import { cachedListMedia, cachedSiteConfig } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export async function generateMetadata() {
  const t = await getTranslations("media");
  return { title: t("title") };
}

export default async function MediaPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const t = await getTranslations("media");
  const [media, config] = await Promise.all([
    cachedListMedia(installation.installationId, site.dataRepo),
    cachedSiteConfig(installation.installationId, site.dataRepo),
  ]);

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-normal text-neutral-800">{t("title")}</h1>
      <p className="mt-2 text-sm text-neutral-500">{t("lead")}</p>

      <MediaUploadForm
        siteId={site.id}
        convertUploadsToWebp={convertUploadsToWebpEnabled(config?.site)}
      />

      {media.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-400">{t("empty")}</p>
      ) : (
        <MediaGrid siteId={site.id} items={media} />
      )}

      <div className="mt-4 space-y-1 text-xs text-neutral-400">
        <p>
          {t("imageRef")}
          <code className="ml-1">{t("imageRefCode")}</code>
        </p>
        <p>
          {t("videoRef")}
          <code className="ml-1">{t("videoRefCode")}</code>
        </p>
      </div>
    </div>
  );
}
