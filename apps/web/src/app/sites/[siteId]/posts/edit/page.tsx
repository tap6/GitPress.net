import { redirect } from "next/navigation";
import { PostEditor } from "@/components/PostEditor";
import { getPost } from "@/lib/content";
import { getInstallationOctokit, listRepoCommits, splitRepo } from "@/lib/github";
import { cachedSiteCategories } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "编辑文章" };

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ path?: string }>;
}) {
  const { siteId } = await params;
  const { path } = await searchParams;
  const { site, installation } = await requireSite(siteId);

  if (!path || !path.startsWith("content/posts/")) {
    redirect(`/sites/${siteId}/posts`);
  }

  const octokit = await getInstallationOctokit(installation.installationId);
  const post = await getPost(octokit, site.dataRepo, path);
  if (!post) redirect(`/sites/${siteId}/posts`);
  const [categories, history] = await Promise.all([
    cachedSiteCategories(installation.installationId, site.dataRepo),
    listRepoCommits(octokit, splitRepo(site.dataRepo), { path: post.path, perPage: 30 }),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mb-5 shrink-0 text-2xl font-normal text-neutral-800">编辑文章</h1>
      <PostEditor
        siteId={siteId}
        path={post.path}
        categories={categories}
        gitCommits={history.commits}
        gitError={history.error}
        initial={{
          title: post.title,
          date: post.date,
          draft: post.draft,
          tags: post.tags,
          category: post.category,
          description: post.description,
          body: post.body,
          slug: post.slug,
        }}
      />
    </div>
  );
}
