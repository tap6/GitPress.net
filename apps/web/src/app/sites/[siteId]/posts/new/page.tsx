import { PostEditor } from "@/components/PostEditor";
import { getInstallationOctokit } from "@/lib/github";
import { loadPublishCheck } from "@/lib/publishCheckRepo";
import { cachedSiteCategories } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "写文章" };

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const octokit = await getInstallationOctokit(installation.installationId);
  const [categories, publishCheck] = await Promise.all([
    cachedSiteCategories(installation.installationId, site.dataRepo),
    loadPublishCheck(octokit, site.dataRepo, site.siteRepo),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mb-5 shrink-0 text-2xl font-normal text-neutral-800">写文章</h1>
      <PostEditor siteId={siteId} categories={categories} publishCheckEnabled={publishCheck.enabled} />
    </div>
  );
}
