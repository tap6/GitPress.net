import { getTranslations } from "next-intl/server";
import { uploadMediaAction } from "@/lib/actions";
import { MediaGrid } from "@/components/MediaGrid";
import { ProgressButton } from "@/components/ProgressButton";
import { MEDIA_LIBRARY_ACCEPT } from "@/lib/mediaTypes";
import { cachedListMedia } from "@/lib/siteDataCache";
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
  const tc = await getTranslations("common");
  const media = await cachedListMedia(installation.installationId, site.dataRepo);

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-normal text-neutral-800">{t("title")}</h1>
      <p className="mt-2 text-sm text-neutral-500">{t("lead")}</p>

      <form
        action={uploadMediaAction}
        className="mt-5 flex flex-wrap items-center gap-3 rounded border border-dashed border-neutral-300 bg-white p-5 shadow-sm"
      >
        <input type="hidden" name="siteId" value={site.id} />
        <input
          type="file"
          name="file"
          accept={MEDIA_LIBRARY_ACCEPT}
          required
          className="text-sm"
        />
        <ProgressButton
          expectedSeconds={8}
          pendingLabel={tc("uploading")}
          buildSiteId={site.id}
          className="rounded bg-wp-accent px-4 py-2 text-sm font-medium text-white hover:bg-wp-accent-dark"
        >
          {t("upload")}
        </ProgressButton>
        <span className="text-xs text-neutral-400">{t("uploadHint")}</span>
      </form>

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
