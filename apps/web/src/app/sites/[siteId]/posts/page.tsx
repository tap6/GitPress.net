import Link from "next/link";
import { deletePostAction } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import { listPosts } from "@/lib/content";
import { getInstallationOctokit } from "@/lib/github";
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
  const posts = await listPosts(octokit, site.dataRepo);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-normal text-neutral-800">文章</h1>
        <Link
          href={`/sites/${site.id}/posts/new`}
          className="rounded border border-wp-accent px-3 py-1 text-sm text-wp-accent hover:bg-wp-accent hover:text-white"
        >
          写文章
        </Link>
      </div>

      {saved && (
        <div className="mt-4 rounded border-l-4 border-emerald-500 bg-white p-3 text-sm shadow-sm">
          已保存并提交到数据仓库,网站将在约 1 分钟后更新。
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
              <th className="px-4 py-2.5 font-medium">标题</th>
              <th className="w-40 px-4 py-2.5 font-medium">标签</th>
              <th className="w-28 px-4 py-2.5 font-medium">日期</th>
              <th className="w-24 px-4 py-2.5 font-medium">状态</th>
              <th className="w-20 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  还没有文章,点击「写文章」开始。
                </td>
              </tr>
            )}
            {posts.map((post) => (
              <tr key={post.path} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/sites/${site.id}/posts/edit?path=${encodeURIComponent(post.path)}`}
                    className="font-medium text-wp-accent hover:underline"
                  >
                    {post.title}
                  </Link>
                  {post.description && (
                    <p className="mt-0.5 truncate text-xs text-neutral-400">{post.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-500">{post.tags.join(", ")}</td>
                <td className="px-4 py-3 text-neutral-500">{post.date ?? "—"}</td>
                <td className="px-4 py-3">
                  {post.draft ? (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">草稿</span>
                  ) : (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">已发布</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={deletePostAction}>
                    <input type="hidden" name="siteId" value={site.id} />
                    <input type="hidden" name="path" value={post.path} />
                    <ProgressButton
                      expectedSeconds={3}
                      pendingLabel="删除中"
                      buildSiteId={site.id}
                      className="text-xs text-red-500 hover:underline"
                    >
                      删除
                    </ProgressButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-neutral-400">
        草稿只存在于你的私有数据仓库,构建时会被排除,绝不会出现在公开网站上。
      </p>
    </div>
  );
}
