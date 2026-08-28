import { PostEditor } from "@/components/PostEditor";
import { getSiteCategories } from "@/lib/content";
import { getInstallationOctokit } from "@/lib/github";
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
  const categories = await getSiteCategories(octokit, site.dataRepo);

  return (
    <div>
      <h1 className="mb-5 text-2xl font-normal text-neutral-800">写文章</h1>
      <PostEditor siteId={siteId} categories={categories} />
    </div>
  );
}
