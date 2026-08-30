import Link from "next/link";
import { rebuildAction } from "@/lib/actions";
import { describeBuildTrigger, formatDuration } from "@/lib/buildLabels";
import {
  RECENT_BUILD_FETCH_COUNT,
  groupRecentBuildRuns,
  scheduledBuildSubtitle,
} from "@/lib/recentBuilds";
import {
  GITHUB_ACTIONS_FREE_INCLUDED_MINUTES,
  getInstallationOctokit,
  getInstallationPermissionGap,
  listBuildRuns,
  splitRepo,
} from "@/lib/github";
import { loadPublishCheck } from "@/lib/publishCheckRepo";
import { cachedActionsUsage, cachedListPosts } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";
import { ActionsUsageChart } from "@/components/ActionsUsageChart";
import { BuildStatusPoller, RunElapsed } from "@/components/BuildStatus";
import { ProgressButton } from "@/components/ProgressButton";
import { ScratchNoteWidget } from "@/components/ScratchNoteWidget";
import { ScheduledWhileOffBanner } from "@/components/ScheduledWhileOffBanner";
import { getScratchNote } from "@/lib/scratchNote";

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
  const [posts, { runs, actionsPermissionMissing }, permissionGap, usage, scratch, publishCheck] =
    await Promise.all([
      cachedListPosts(installation.installationId, site.dataRepo),
      listBuildRuns(octokit, splitRepo(site.dataRepo), { perPage: RECENT_BUILD_FETCH_COUNT }),
      getInstallationPermissionGap(installation.installationId),
      cachedActionsUsage({
        installationId: installation.installationId,
        dataRepo: site.dataRepo,
        accountLogin: installation.accountLogin,
        accountType: installation.accountType,
        userToken: installation.userToken,
      }),
      getScratchNote(site.id),
      loadPublishCheck(octokit, site.dataRepo, site.siteRepo),
    ]);
  const buildGroups = groupRecentBuildRuns(runs);
  const published = posts.filter((post) => !post.draft).length;
  const drafts = posts.length - published;
  const hasRunningBuild = runs.some((run) => run.conclusion == null);

  return (
    <div className="max-w-6xl">
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

      {!publishCheck.enabled && <ScheduledWhileOffBanner siteId={site.id} posts={posts} />}

      {scratch.enabled && <ScratchNoteWidget siteId={site.id} initialBody={scratch.body} />}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-light">{published}</p>
          <p className="mt-1 text-sm text-neutral-500">已发布文章</p>
        </div>
        <div className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-light">{drafts}</p>
          <p className="mt-1 text-sm text-neutral-500">草稿(写入私有仓库,公开站点不显示)</p>
        </div>
        <div className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-light">{site.themeName}</p>
          <p className="mt-1 text-sm text-neutral-500">当前主题</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-5 py-3">
          <h2 className="text-sm font-semibold">GitHub Actions 用量</h2>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">
            {usage.periodLabel}
          </span>
        </div>
        <div className="p-5">
          <p className="text-xs text-neutral-400">
            构建跑在私有数据仓库上,会计入 GitHub 每月免费额度;公开仓库不消耗分钟数。GitPress
            已把插图改成随文章一次提交,避免每张图单独触发一次构建。
          </p>
          {usage.actionsPermissionMissing ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              当前安装还没有 Actions 读取权限,无法统计本站构建时长。
              {permissionGap ? (
                <>
                  {" "}
                  <a
                    href={permissionGap.reviewUrl}
                    className="font-medium underline hover:text-amber-950"
                  >
                    前往 GitHub 批准
                  </a>
                </>
              ) : null}
            </div>
          ) : (
            <div className="mt-4">
              <ActionsUsageChart
                daily={usage.daily}
                siteMinutes={usage.siteMinutesThisMonth ?? 0}
                siteRunCount={usage.siteRunCountThisMonth ?? 0}
                accountMinutes={usage.accountMinutesThisMonth}
                includedMinutes={
                  usage.accountIncludedMinutes ?? GITHUB_ACTIONS_FREE_INCLUDED_MINUTES
                }
                quotaIsEstimate={usage.accountIncludedMinutes == null}
                periodLabel={usage.periodLabel}
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50 px-5 py-3 text-sm">
          <a
            href={usage.billingUrl}
            target="_blank"
            rel="noreferrer"
            className="text-wp-accent hover:underline"
          >
            打开 GitHub 账单页 ↗
          </a>
          {usage.billingUnavailable && (
            <span className="text-xs text-neutral-400">帐户总额 GitHub App 读不到,以账单页为准</span>
          )}
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
            <Link href={`/sites/${site.id}/pages/new`} className="block text-wp-accent hover:underline">
              ▢ 写新页面
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
          <h2 className="flex flex-wrap items-center justify-between gap-1 border-b border-neutral-100 px-5 py-3 text-sm font-semibold">
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
                当前 GitHub App 安装还没有「Actions」权限,这里无法读取构建记录(文章保存后仍会正常触发构建)。
                {permissionGap ? (
                  <>
                    {" "}
                    点顶部横幅或{" "}
                    <a href={permissionGap.reviewUrl} className="text-wp-accent hover:underline">
                      前往 GitHub 批准新权限
                    </a>
                    ,无需卸载重装。
                  </>
                ) : (
                  <>
                    {" "}
                    也可以去{" "}
                    <a
                      href={`https://github.com/${site.dataRepo}/actions`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-wp-accent hover:underline"
                    >
                      GitHub Actions 页面
                    </a>{" "}
                    查看真实状态。
                  </>
                )}
              </p>
            ) : runs.length === 0 ? (
              <p className="text-neutral-400">暂无构建记录。</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {buildGroups.map((group) => {
                  const run = group.latest;
                  const latestTime = new Date(run.createdAt).toLocaleString("zh-CN");
                  const timeLabel =
                    run.event === "schedule"
                      ? scheduledBuildSubtitle(group, latestTime)
                      : latestTime;
                  return (
                    <li
                      key={group.key}
                      className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-700">
                          {describeBuildTrigger(run.commitMessage, run.event)}
                        </p>
                        <a
                          href={run.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-neutral-400 hover:text-wp-accent hover:underline"
                        >
                          {timeLabel}
                        </a>
                      </div>
                      <span
                        className={`shrink-0 text-xs ${
                          run.conclusion === "success"
                            ? "text-emerald-600"
                            : run.conclusion === "failure"
                              ? "text-red-600"
                              : "text-neutral-400"
                        }`}
                      >
                        {run.conclusion ? (
                          <>
                            {RUN_LABEL[run.conclusion] ?? run.conclusion}
                            {formatDuration(run.durationSeconds) && (
                              <span className="ml-1 text-neutral-400">
                                · {formatDuration(run.durationSeconds)}
                              </span>
                            )}
                          </>
                        ) : (
                          <RunElapsed createdAt={run.createdAt} />
                        )}
                      </span>
                    </li>
                  );
                })}
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
            <p className="mt-1">
              <Link href={`/sites/${siteId}/history`} className="text-xs text-neutral-500 hover:text-wp-accent hover:underline">
                查看 Git 记录
              </Link>
            </p>
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
