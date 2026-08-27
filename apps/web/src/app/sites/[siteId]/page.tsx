import Link from "next/link";
import { rebuildAction } from "@/lib/actions";
import { listPosts } from "@/lib/content";
import { getInstallationOctokit, listBuildRuns, splitRepo } from "@/lib/github";
import { requireSite } from "@/lib/sites";
import { BuildStatusPoller, RunElapsed } from "@/components/BuildStatus";
import { ProgressButton } from "@/components/ProgressButton";

export const metadata = { title: "仪表盘" };

const RUN_LABEL: Record<string, string> = {
  success: "✓ 成功",
  failure: "✗ 失败",
  cancelled: "已取消",
};

export default async function SiteDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { siteId } = await params;
  const { created } = await searchParams;
  const { site, installation } = await requireSite(siteId);

  const octokit = await getInstallationOctokit(installation.installationId);
  const [posts, { runs, actionsPermissionMissing }] = await Promise.all([
    listPosts(octokit, site.dataRepo),
    listBuildRuns(octokit, splitRepo(site.dataRepo)),
  ]);
  const published = posts.filter((post) => !post.draft).length;
  const drafts = posts.length - published;
  const hasRunningBuild = runs.some((run) => run.conclusion == null);

  return (
    <div className="max-w-4xl">
      <BuildStatusPoller active={hasRunningBuild} />
      <h1 className="text-2xl font-normal text-neutral-800">仪表盘</h1>

      {created && (
        <div className="mt-4 rounded border-l-4 border-emerald-500 bg-white p-4 text-sm shadow-sm">
          站点创建成功!首次构建正在 GitHub Actions 中进行,通常 1–2 分钟后
          {site.url && (
            <>
              {" "}
              <a href={site.url} target="_blank" rel="noreferrer" className="text-wp-accent underline">
                {site.url}
              </a>{" "}
            </>
          )}
          即可访问。
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-light">{published}</p>
          <p className="mt-1 text-sm text-neutral-500">已发布文章</p>
        </div>
        <div className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-light">{drafts}</p>
          <p className="mt-1 text-sm text-neutral-500">草稿(仅存于私有仓库)</p>
        </div>
        <div className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-light">{site.themeName}</p>
          <p className="mt-1 text-sm text-neutral-500">当前主题</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Quick actions */}
        <div className="rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">快速操作</h2>
          <div className="space-y-2 p-5 text-sm">
            <Link href={`/sites/${site.id}/posts/new`} className="block text-wp-accent hover:underline">
              ✎ 写新文章
            </Link>
            <Link href={`/sites/${site.id}/appearance`} className="block text-wp-accent hover:underline">
              ◧ 更换主题
            </Link>
            <form action={rebuildAction}>
              <input type="hidden" name="siteId" value={site.id} />
              <ProgressButton
                expectedSeconds={5}
                pendingLabel="触发中"
                buildSiteId={site.id}
                className="text-wp-accent hover:underline"
              >
                ↻ 手动触发重新构建
              </ProgressButton>
            </form>
          </div>
        </div>

        {/* Recent builds */}
        <div className="rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="flex items-center justify-between border-b border-neutral-100 px-5 py-3 text-sm font-semibold">
            最近构建
            {hasRunningBuild && (
              <span className="text-xs font-normal text-neutral-400">
                通常 1–2 分钟完成 · 本页每 5 秒自动刷新
              </span>
            )}
          </h2>
          <div className="p-5 text-sm">
            {actionsPermissionMissing ? (
              <p className="text-neutral-500">
                GitHub App 缺少「Actions」权限,这里无法读取构建记录(但内容更新仍会正常
                自动触发构建)。去{" "}
                <a
                  href={`https://github.com/${site.dataRepo}/actions`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-wp-accent hover:underline"
                >
                  GitHub Actions 页面
                </a>{" "}
                查看真实状态,或在{" "}
                <a
                  href={`https://github.com/settings/apps`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-wp-accent hover:underline"
                >
                  App 设置
                </a>{" "}
                中为 App 添加「Actions: Read and write」权限并重新授权安装。
              </p>
            ) : runs.length === 0 ? (
              <p className="text-neutral-400">暂无构建记录。</p>
            ) : (
              <ul className="space-y-2">
                {runs.map((run) => (
                  <li key={run.id} className="flex items-center justify-between">
                    <a
                      href={run.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-wp-accent hover:underline"
                    >
                      {new Date(run.createdAt).toLocaleString("zh-CN")}
                    </a>
                    <span
                      className={
                        run.conclusion === "success"
                          ? "text-emerald-600"
                          : run.conclusion === "failure"
                            ? "text-red-600"
                            : "text-neutral-400"
                      }
                    >
                      {run.conclusion ? (
                        (RUN_LABEL[run.conclusion] ?? run.conclusion)
                      ) : (
                        <RunElapsed createdAt={run.createdAt} />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Repos */}
      <div className="mt-6 rounded border border-neutral-200 bg-white shadow-sm">
        <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">仓库</h2>
        <div className="grid gap-3 p-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-neutral-400">数据仓库(私有)</p>
            <a
              href={`https://github.com/${site.dataRepo}`}
              target="_blank"
              rel="noreferrer"
              className="text-wp-accent hover:underline"
            >
              {site.dataRepo}
            </a>
          </div>
          <div>
            <p className="text-neutral-400">网站仓库(公开)</p>
            <a
              href={`https://github.com/${site.siteRepo}`}
              target="_blank"
              rel="noreferrer"
              className="text-wp-accent hover:underline"
            >
              {site.siteRepo}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
