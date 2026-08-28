import { redirect } from "next/navigation";
import { PostEditor } from "@/components/PostEditor";
import { getPost, getSiteCategories } from "@/lib/content";
import { getInstallationOctokit } from "@/lib/github";
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
  const categories = await getSiteCategories(octokit, site.dataRepo);

  return (
    <div>
      <h1 className="mb-5 text-2xl font-normal text-neutral-800">编辑文章</h1>
      <PostEditor
        siteId={siteId}
        path={post.path}
        categories={categories}
        initial={{
          title: post.title,
          date: post.date,
          draft: post.draft,
          tags: post.tags,
          category: post.category,
          description: post.description,
          body: post.body,
        }}
      />
    </div>
  );
}
