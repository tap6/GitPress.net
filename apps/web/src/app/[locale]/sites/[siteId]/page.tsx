import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { rebuildAction } from "@/lib/actions";
import {
  describeBuildTrigger,
  formatDurationLabel,
  formatGitChange,
} from "@/lib/buildLabels";
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
import { resolveInstallationUserToken } from "@/lib/userAccessToken";
import { ActionsUsageChart } from "@/components/ActionsUsageChart";
import { BuildStatusPoller, RunElapsed } from "@/components/BuildStatus";
import { ProgressButton } from "@/components/ProgressButton";
import { ScratchNoteWidget } from "@/components/ScratchNoteWidget";
import { ScheduledWhileOffBanner } from "@/components/ScheduledWhileOffBanner";
import { getScratchNote } from "@/lib/scratchNote";
import type { ReactNode } from "react";

function QuickIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export async function generateMetadata() {
  const t = await getTranslations("siteDash");
  return { title: t("title") };
}

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
  const locale = await getLocale();
  const t = await getTranslations("siteDash");
  const tb = await getTranslations("buildHistory");
  const tg = await getTranslations("github");
  const dateLocale = locale === "zh" ? "zh-CN" : "en";

  const octokit = await getInstallationOctokit(installation.installationId);
  const userToken = await resolveInstallationUserToken(installation);
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
        userToken,
      }),
      getScratchNote(site.id),
      loadPublishCheck(octokit, site.dataRepo, site.siteRepo),
    ]);
  const buildGroups = groupRecentBuildRuns(runs);
  const published = posts.filter((post) => !post.draft).length;
  const drafts = posts.length - published;
  const hasRunningBuild = runs.some((run) => run.conclusion == null);
  const runLabel: Record<string, string> = {
    success: t("runSuccess"),
    failure: t("runFailure"),
    cancelled: t("runCancelled"),
  };

  return (
    <div className="max-w-6xl">
      <BuildStatusPoller active={hasRunningBuild} />
      <h1 className="text-2xl font-normal text-neutral-800">{t("title")}</h1>

      {created && (
        <div className="mt-4 rounded border-l-4 border-emerald-500 bg-white p-4 text-sm shadow-sm">
          {t("created")}
          {site.url ? (
            <>
              {" "}
              <a href={site.url} target="_blank" rel="noreferrer" className="text-wp-accent underline">
                {site.url}
              </a>
            </>
          ) : null}
        </div>
      )}

      {!publishCheck.enabled && <ScheduledWhileOffBanner siteId={site.id} posts={posts} />}

      {scratch.enabled && <ScratchNoteWidget siteId={site.id} initialBody={scratch.body} />}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-light">{published}</p>
          <p className="mt-1 text-sm text-neutral-500">{t("published")}</p>
        </div>
        <div className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-light">{drafts}</p>
          <p className="mt-1 text-sm text-neutral-500">{t("drafts")}</p>
        </div>
        <div className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-light">{site.themeName}</p>
          <p className="mt-1 text-sm text-neutral-500">{t("currentTheme")}</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-5 py-3">
          <h2 className="text-sm font-semibold">{t("usageTitle")}</h2>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">{usage.periodLabel}</span>
        </div>
        <div className="p-5">
          <p className="text-xs text-neutral-400">{t("usageHint")}</p>
          {usage.actionsPermissionMissing ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t("usageNoPerm")}
              {permissionGap ? (
                <>
                  {" "}
                  <a href={permissionGap.reviewUrl} className="font-medium underline hover:text-amber-950">
                    {tg("reviewPermissions")}
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
                includedMinutes={usage.accountIncludedMinutes ?? GITHUB_ACTIONS_FREE_INCLUDED_MINUTES}
                quotaIsEstimate={usage.accountIncludedMinutes == null}
                periodLabel={usage.periodLabel}
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50 px-5 py-3 text-sm">
          <a href={usage.billingUrl} target="_blank" rel="noreferrer" className="text-wp-accent hover:underline">
            {t("billing")}
          </a>
          {usage.billingUnavailable && <span className="text-xs text-neutral-400">{t("billingUnavailable")}</span>}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("quick")}</h2>
          <div className="space-y-2 p-5 text-sm">
            <Link href={`/sites/${site.id}/posts/new`} className="flex items-center gap-2 text-wp-accent hover:underline">
              <QuickIcon>
                <path d="M11.5 2.5 13.5 4.5 6 12H4v-2z" />
              </QuickIcon>
              {t("newPost")}
            </Link>
            <Link href={`/sites/${site.id}/pages/new`} className="flex items-center gap-2 text-wp-accent hover:underline">
              <QuickIcon>
                <path d="M5 2.5h5l2.5 2.5V13.5H5z" />
                <path d="M10 2.5V5h2.5" />
                <path d="M6.5 8h3M6.5 10.5h3" />
              </QuickIcon>
              {t("newPage")}
            </Link>
            <Link href={`/sites/${site.id}/appearance`} className="flex items-center gap-2 text-wp-accent hover:underline">
              <QuickIcon>
                <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
                <path d="M8 2.5v11" />
                <path d="M8 2.5h5.5v11H8z" fill="currentColor" stroke="none" opacity="0.35" />
              </QuickIcon>
              {t("changeTheme")}
            </Link>
            <form action={rebuildAction}>
              <input type="hidden" name="siteId" value={site.id} />
              <ProgressButton
                expectedSeconds={5}
                pendingLabel={t("rebuildPending")}
                buildSiteId={site.id}
                className="flex items-center gap-2 text-wp-accent hover:underline"
              >
                <QuickIcon>
                  <path d="M3.5 8a4.5 4.5 0 0 1 7.6-3.2" />
                  <path d="M12 3.5v3h-3" />
                  <path d="M12.5 8a4.5 4.5 0 0 1-7.6 3.2" />
                  <path d="M4 12.5v-3h3" />
                </QuickIcon>
                {t("rebuild")}
              </ProgressButton>
            </form>
          </div>
        </div>

        <div className="rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="flex flex-wrap items-center justify-between gap-1 border-b border-neutral-100 px-5 py-3 text-sm font-semibold">
            {t("recentBuilds")}
            {hasRunningBuild && <span className="text-xs font-normal text-neutral-400">{t("runningHint")}</span>}
          </h2>
          <div className="p-5 text-sm">
            {actionsPermissionMissing ? (
              <p className="text-neutral-500">
                {t("noActionsPerm")}
                {permissionGap ? (
                  <>
                    {" "}
                    {t("bannerOr")}{" "}
                    <a href={permissionGap.reviewUrl} className="text-wp-accent hover:underline">
                      {t("reviewNew")}
                    </a>
                    {t("noReinstall")}
                  </>
                ) : (
                  <>
                    {" "}
                    {t("orSee")}{" "}
                    <a
                      href={`https://github.com/${site.dataRepo}/actions`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-wp-accent hover:underline"
                    >
                      {t("actionsPage")}
                    </a>{" "}
                    {t("seeStatus")}
                  </>
                )}
              </p>
            ) : runs.length === 0 ? (
              <p className="text-neutral-400">{t("noRuns")}</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {buildGroups.map((group) => {
                  const run = group.latest;
                  const latestTime = new Date(run.createdAt).toLocaleString(dateLocale);
                  const timeLabel =
                    run.event === "schedule" ? scheduledBuildSubtitle(group, latestTime, tb) : latestTime;
                  const duration = formatDurationLabel(run.durationSeconds, tb);
                  return (
                    <li
                      key={group.key}
                      className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-700">
                          {formatGitChange(describeBuildTrigger(run.commitMessage, run.event), tb)}
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
                            {runLabel[run.conclusion] ?? run.conclusion}
                            {duration ? <span className="ml-1 text-neutral-400">· {duration}</span> : null}
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

      <div className="mt-6 rounded border border-neutral-200 bg-white shadow-sm">
        <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("repos")}</h2>
        <div className="grid gap-3 p-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-neutral-400">{t("dataRepo")}</p>
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
                {t("viewHistory")}
              </Link>
            </p>
          </div>
          <div>
            <p className="text-neutral-400">{t("siteRepo")}</p>
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
