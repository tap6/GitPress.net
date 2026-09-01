import { getTranslations } from "next-intl/server";
import { PostEditor } from "@/components/PostEditor";
import { getInstallationOctokit } from "@/lib/github";
import { loadPublishCheck } from "@/lib/publishCheckRepo";
import { cachedSiteCategories, cachedSiteConfig } from "@/lib/siteDataCache";
import { convertUploadsToWebpEnabled } from "@/lib/convertUploadWebp";
import { requireSite } from "@/lib/sites";

export async function generateMetadata() {
  const t = await getTranslations("editor");
  return { title: t("newPost") };
}

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const t = await getTranslations("editor");
  const octokit = await getInstallationOctokit(installation.installationId);
  const [categories, publishCheck, config] = await Promise.all([
    cachedSiteCategories(installation.installationId, site.dataRepo),
    loadPublishCheck(octokit, site.dataRepo, site.siteRepo),
    cachedSiteConfig(installation.installationId, site.dataRepo),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mb-5 shrink-0 text-2xl font-normal text-neutral-800">{t("newPost")}</h1>
      <PostEditor
        siteId={siteId}
        categories={categories}
        publishCheckEnabled={publishCheck.enabled}
        convertUploadsToWebp={convertUploadsToWebpEnabled(config?.site)}
      />
    </div>
  );
}
