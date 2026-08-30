import Link from "next/link";
import { PostsTable } from "./PostsTable";
import { getInstallationOctokit } from "@/lib/github";
import { loadPublishCheck } from "@/lib/publishCheckRepo";
import { cachedListPosts, cachedSiteCategories } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "文章" };

export default async function PostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { siteId } = await params;
  const { saved } = await searchParams;
  const { site, installation } = await requireSite(siteId);
  const octokit = await getInstallationOctokit(installation.installationId);
  const [posts, categories, publishCheck] = await Promise.all([
    cachedListPosts(installation.installationId, site.dataRepo),
    cachedSiteCategories(installation.installationId, site.dataRepo),
    loadPublishCheck(octokit, site.dataRepo, site.siteRepo),
  ]);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-normal text-neutral-800">文章</h1>
        <Link
          href={`/sites/${site.id}/posts/new`}
          className="rounded border border-wp-accent px-3 py-1 text-sm text-wp-accent hover:bg-wp-accent hover:text-white"
        >
          写文章
        </Link>
      </div>

      {saved === "draft" && (
        <div className="mt-4 rounded border-l-4 border-amber-400 bg-white p-3 text-sm shadow-sm">
          已保存到私有数据仓库。构建仍会跑,但这篇草稿不会出现在公开网站。
        </div>
      )}
      {saved === "1" && (
        <div className="mt-4 rounded border-l-4 border-emerald-500 bg-white p-3 text-sm shadow-sm">
          已保存并提交到数据仓库,网站将在约 1 分钟后更新。
        </div>
      )}

      <PostsTable
        siteId={site.id}
        posts={posts}
        categories={categories}
        publishCheckEnabled={publishCheck.enabled}
      />

      <p className="mt-3 text-xs text-neutral-400">
        状态只有两种:「已发布」会出现在公开站点;「草稿」会写入私有数据仓库并触发构建,但公开站点不显示。静态博客没有登录态,因此不另做「仅自己可见」的第三种状态。{" "}
        <Link href="/help/drafts-and-builds" className="text-wp-accent hover:underline">
          底稿、草稿和已发布
        </Link>
      </p>
    </div>
  );
}
