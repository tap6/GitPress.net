import { redirectTo } from "@/i18n/redirect";
import { getTranslations } from "next-intl/server";
import { PostEditor } from "@/components/PostEditor";
import { getPost } from "@/lib/content";
import { getInstallationOctokit, listRepoCommits, splitRepo } from "@/lib/github";
import { loadPublishCheck } from "@/lib/publishCheckRepo";
import { cachedSiteCategories } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export async function generateMetadata() {
  const t = await getTranslations("editor");
  return { title: t("editPost") };
}

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
  const t = await getTranslations("editor");

  if (!path || !path.startsWith("content/posts/")) {
    return await redirectTo(`/sites/${siteId}/posts`);
  }

  const octokit = await getInstallationOctokit(installation.installationId);
  const post = await getPost(octokit, site.dataRepo, path);
  if (!post) return await redirectTo(`/sites/${siteId}/posts`);
  const [categories, history, publishCheck] = await Promise.all([
    cachedSiteCategories(installation.installationId, site.dataRepo),
    listRepoCommits(octokit, splitRepo(site.dataRepo), { path: post.path, perPage: 30 }),
    loadPublishCheck(octokit, site.dataRepo, site.siteRepo),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mb-5 shrink-0 text-2xl font-normal text-neutral-800">{t("editPost")}</h1>
      <PostEditor
        siteId={siteId}
        path={post.path}
        categories={categories}
        gitCommits={history.commits}
        gitError={history.error}
        publishCheckEnabled={publishCheck.enabled}
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
