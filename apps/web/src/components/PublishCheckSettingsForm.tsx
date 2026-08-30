"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { savePublishCheckAction, type SavePublishCheckState } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import {
  DEFAULT_ESTIMATE_POSTS_PER_MONTH,
  DEFAULT_PUBLISH_CHECK_INTERVAL,
  ESTIMATED_MINUTES_PER_SCHEDULED_RUN,
  ESTIMATED_SAVES_PER_POST,
  estimatePublishCheck,
  estimateWritingMinutes,
  getPublishCheckInterval,
  PUBLISH_CHECK_INTERVALS,
  PUBLISH_CHECK_QUOTA_MINUTES,
  projectQuotaUsage,
  publishCheckConfirmKey,
  QUOTA_CAUTION_PERCENT,
  recommendPublishCheckInterval,
  SUGGESTED_PUBLISH_CHECK_INTERVAL,
  type OtherPublishCheck,
  type PublishCheckIntervalId,
} from "@/lib/publishCheck";

function delayHint(minutes: number): string {
  if (minutes < 60) return `最多再等约 ${minutes} 分钟`;
  if (minutes === 60) return "最多再等约 1 小时";
  if (minutes < 1440) return `最多再等约 ${minutes / 60} 小时`;
  return "最多再等约 1 天";
}

function intervalLabel(id: PublishCheckIntervalId): string {
  return getPublishCheckInterval(id).label;
}

function formatMinutes(value: number): string {
  return `${value} 分钟`;
}

function stackedBarTone(percent: number, selected: boolean): string {
  if (percent >= 100) return selected ? "bg-red-600" : "bg-red-200";
  if (percent >= QUOTA_CAUTION_PERCENT) return selected ? "bg-amber-500" : "bg-amber-200";
  return selected ? "bg-wp-accent" : "bg-neutral-300";
}

export function PublishCheckSettingsForm({
  siteId,
  enabled,
  interval,
  dataRepoPrivate,
  accountLogin,
  sameAccountSiteCount,
  otherChecks,
  otherPrivateMinutes,
  accountUsedMinutes,
}: {
  siteId: string;
  enabled: boolean;
  interval: PublishCheckIntervalId | null;
  dataRepoPrivate: boolean;
  accountLogin: string;
  sameAccountSiteCount: number;
  otherChecks: OtherPublishCheck[];
  otherPrivateMinutes: number;
  accountUsedMinutes: number | null;
}) {
  const [on, setOn] = useState(enabled);
  const [choice, setChoice] = useState<PublishCheckIntervalId>(
    interval ?? DEFAULT_PUBLISH_CHECK_INTERVAL,
  );
  const [estimatorOpen, setEstimatorOpen] = useState(otherChecks.length > 0);
  const [postsPerMonth, setPostsPerMonth] = useState(DEFAULT_ESTIMATE_POSTS_PER_MONTH);
  const [state, formAction] = useActionState<SavePublishCheckState, FormData>(
    savePublishCheckAction,
    {},
  );
  const writingMinutes = estimateWritingMinutes(postsPerMonth);
  const projection = useMemo(
    () =>
      projectQuotaUsage({
        enabled: on,
        interval: choice,
        isPrivate: dataRepoPrivate,
        otherMinutes: otherPrivateMinutes,
        writingMinutes,
        otherChecks,
        accountUsedMinutes,
      }),
    [accountUsedMinutes, choice, dataRepoPrivate, on, otherChecks, otherPrivateMinutes, writingMinutes],
  );
  const recommended = recommendPublishCheckInterval(postsPerMonth, otherPrivateMinutes);
  const recommendedLabel = intervalLabel(recommended);
  const selectedMeta = PUBLISH_CHECK_INTERVALS.find((item) => item.id === choice);
  const multiSite = sameAccountSiteCount > 1;
  const showQuota = dataRepoPrivate;
  const overCaution = showQuota && on && projection.percent >= QUOTA_CAUTION_PERCENT;
  const currentConfirmKey = publishCheckConfirmKey(on, on ? choice : null);
  const showConfirm = Boolean(state.needsConfirm && state.confirmKey === currentConfirmKey);

  return (
    <form action={formAction} className="space-y-4 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      {showConfirm && state.confirmKey && (
        <input type="hidden" name="confirmedFor" value={state.confirmKey} />
      )}
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="enabled"
          value="on"
          checked={on}
          onChange={(event) => setOn(event.target.checked)}
          className="mt-0.5 accent-wp-accent"
        />
        <span>
          <span className="font-medium text-neutral-800">定时发布检查</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
            关闭时不能把文章日期选到现在之后。打开后按间隔检查到期稿，不是对准那一分钟。
          </span>
        </span>
      </label>

      {multiSite && (
        <p className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-600">
          GitHub 帐户 <span className="font-medium text-neutral-800">{accountLogin}</span>{" "}
          下还有 {sameAccountSiteCount - 1} 个站，私有仓的 Actions
          免费时长是同一池。
          {otherChecks.length > 0 ? (
            <>
              {" "}
              已开启检查的有
              {otherChecks.map((site, index) => (
                <span key={site.siteId}>
                  {index > 0 ? "、" : ""}
                  <Link
                    href={`/sites/${site.siteId}/settings#publish`}
                    className="text-wp-accent hover:underline"
                  >
                    {site.name}
                  </Link>
                  （{intervalLabel(site.interval)}，约 {formatMinutes(site.minutesPerMonth)}）
                </span>
              ))}
              ，和这边加在一起会叠上去。
            </>
          ) : (
            <> 这边打开后，其他站再开检查也会叠加上去。</>
          )}
        </p>
      )}

      {on && (
        <div className="space-y-4 rounded border border-neutral-100 bg-neutral-50 p-4">
          <label className="block">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-medium">检查间隔</span>
              <span className="text-[11px] text-neutral-500">
                单站默认建议
                <span className="font-medium text-neutral-800"> 每 2 小时</span>
                。额度还宽时，预估工具也可能建议 1 小时。
              </span>
            </span>
            <select
              name="interval"
              value={choice}
              onChange={(event) => setChoice(event.target.value as PublishCheckIntervalId)}
              className="mt-1.5 w-full rounded border border-neutral-300 bg-white px-3 py-2"
            >
              {PUBLISH_CHECK_INTERVALS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                  {item.id === SUGGESTED_PUBLISH_CHECK_INTERVAL ? "（建议）" : ""}
                  {` · ${delayHint(item.minutes)}`}
                </option>
              ))}
            </select>
          </label>

          <ul className="space-y-1 text-xs leading-relaxed text-neutral-500">
            <li>
              <span className="font-medium text-neutral-800">不是准时到点。</span>
              到点后最多再等这一个间隔（当前：{delayHint(selectedMeta?.minutes ?? 120)}）。
            </li>
            <li>
              <span className="font-medium text-neutral-800">检查会一直跑。</span>
              打开后按间隔构建，不随这个月写几篇变少。
            </li>
            <li>
              <span className="font-medium text-neutral-800">
                每次约 {ESTIMATED_MINUTES_PER_SCHEDULED_RUN} 分钟
              </span>
              ，多站共用同一帐户额度。能接受更粗的延迟，就能给写文章留更多时长。
            </li>
          </ul>

          {showQuota && (
            <div>
              <p className="text-[11px] font-medium text-neutral-600">帐户合计（本站检查 + 其他站 + 写作预估）</p>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-neutral-200/80">
                <div className="flex h-full">
                  {projection.otherMinutes > 0 && (
                    <span
                      className="h-full bg-neutral-500"
                      style={{
                        width: `${Math.min(100, (projection.otherMinutes / PUBLISH_CHECK_QUOTA_MINUTES) * 100)}%`,
                      }}
                    />
                  )}
                  {projection.thisMinutes > 0 && (
                    <span
                      className="h-full bg-wp-accent"
                      style={{
                        width: `${Math.min(
                          100 - (projection.otherMinutes / PUBLISH_CHECK_QUOTA_MINUTES) * 100,
                          (projection.thisMinutes / PUBLISH_CHECK_QUOTA_MINUTES) * 100,
                        )}%`,
                      }}
                    />
                  )}
                  {projection.writingMinutes > 0 && (
                    <span
                      className="h-full bg-sky-400"
                      style={{
                        width: `${Math.min(
                          8,
                          (projection.writingMinutes / PUBLISH_CHECK_QUOTA_MINUTES) * 100,
                        )}%`,
                      }}
                    />
                  )}
                </div>
              </div>
              <p
                className={`mt-1.5 text-[11px] leading-relaxed ${
                  overCaution ? "text-amber-800" : "text-neutral-500"
                }`}
              >
                约 {formatMinutes(projection.totalMinutes)} / {PUBLISH_CHECK_QUOTA_MINUTES}，占{" "}
                <span className="font-medium">{projection.percent}%</span>
                {projection.otherMinutes > 0 ? "（灰=其他站，强调色=本站，蓝=写作）" : "（强调色=本站检查，蓝=写作）"}
                {overCaution ? `。已超过 ${QUOTA_CAUTION_PERCENT}%，保存前会请你确认。` : "。"}
              </p>
            </div>
          )}

          <div>
            <p className="text-[11px] font-medium text-neutral-600">
              {showQuota ? "各间隔叠上其他站后约占额度" : "各间隔预计检查次数（公开仓通常不占这 2000）"}
            </p>
            <ul className="mt-2 space-y-1.5">
              {PUBLISH_CHECK_INTERVALS.map((item) => {
                const row = estimatePublishCheck(item.id);
                const stacked = projectQuotaUsage({
                  enabled: true,
                  interval: item.id,
                  isPrivate: dataRepoPrivate,
                  otherMinutes: otherPrivateMinutes,
                  writingMinutes,
                  otherChecks,
                });
                const selected = item.id === choice;
                const suggested = item.id === SUGGESTED_PUBLISH_CHECK_INTERVAL;
                const shownPercent = showQuota ? stacked.percent : row.percentOfQuota;
                const width = Math.min(100, shownPercent);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setChoice(item.id)}
                      className={`grid w-full grid-cols-[7.5rem_1fr_4.5rem] items-center gap-2 rounded px-1 py-0.5 text-left text-[11px] ${
                        selected ? "bg-white ring-1 ring-neutral-200" : "hover:bg-white/70"
                      }`}
                    >
                      <span className={selected ? "font-medium text-neutral-800" : "text-neutral-600"}>
                        {item.label}
                        {suggested ? <span className="text-neutral-400"> · 建议</span> : null}
                      </span>
                      <span className="h-2 overflow-hidden rounded-full bg-neutral-200/80">
                        <span
                          className={`block h-full rounded-full ${stackedBarTone(shownPercent, selected)}`}
                          style={{ width: `${Math.max(width, shownPercent > 0 ? 4 : 0)}%` }}
                        />
                      </span>
                      <span
                        className={`tabular-nums ${
                          shownPercent >= 100
                            ? "font-medium text-red-700"
                            : shownPercent >= QUOTA_CAUTION_PERCENT
                              ? "text-amber-800"
                              : selected
                                ? "text-neutral-800"
                                : "text-neutral-500"
                        }`}
                      >
                        {showQuota ? `${shownPercent}%` : `${row.runsPerMonth} 次`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded border border-neutral-200 bg-white">
            <button
              type="button"
              onClick={() => setEstimatorOpen((open) => !open)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-neutral-700"
              aria-expanded={estimatorOpen}
            >
              <span>按写作量和其它站点估一下</span>
              <span className="text-neutral-400">{estimatorOpen ? "收起" : "展开"}</span>
            </button>
            {estimatorOpen && (
              <div className="space-y-3 border-t border-neutral-100 px-3 py-3 text-xs leading-relaxed text-neutral-600">
                <label className="block">
                  <span className="text-neutral-500">这个站每月大约写几篇</span>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={postsPerMonth}
                    onChange={(event) => setPostsPerMonth(Number(event.target.value) || 0)}
                    className="mt-1 w-28 rounded border border-neutral-300 px-2 py-1.5"
                  />
                </label>
                <p>
                  保存大约{" "}
                  <span className="font-medium text-neutral-800">{formatMinutes(writingMinutes)}</span>
                  （每篇按 {ESTIMATED_SAVES_PER_POST} 次、每次约 {ESTIMATED_MINUTES_PER_SCHEDULED_RUN}{" "}
                  分钟）。篇数几乎只影响保存，检查是固定开销。
                </p>
                <p>
                  本站检查 {formatMinutes(projection.thisMinutes)}
                  {projection.otherMinutes > 0
                    ? ` + 其他站 ${formatMinutes(projection.otherMinutes)}`
                    : ""}
                  {` + 写作 ${formatMinutes(projection.writingMinutes)} ≈ `}
                  <span className="font-medium text-neutral-800">
                    {formatMinutes(projection.totalMinutes)}
                  </span>
                  {showQuota ? `，约占 ${projection.percent}%。` : "。"}
                  {accountUsedMinutes != null
                    ? ` 帐户本月已用约 ${Math.round(accountUsedMinutes)} 分钟（和上面的整月预估不是同一笔账）。`
                    : ""}
                </p>
                <p>
                  按这个帐户池，建议选{" "}
                  <span className="font-medium text-neutral-800">{recommendedLabel}</span>
                  。有余量就会建议到 1 小时；其他站已经占了很多时，会自动放宽，把时长留给写文章。
                </p>
                {recommended !== choice && (
                  <button
                    type="button"
                    onClick={() => setChoice(recommended)}
                    className="rounded border border-neutral-300 px-3 py-1.5 font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    采用建议「{recommendedLabel}」
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-neutral-400">
        <Link href="/help/drafts-and-builds" className="text-wp-accent hover:underline" target="_blank">
          定时发布说明
        </Link>
      </p>

      {showConfirm && state.warning && (
        <div className="space-y-2 rounded border border-amber-300 bg-amber-50 px-3 py-3 text-xs leading-relaxed text-amber-950">
          <p className="font-medium">请谨慎选择</p>
          <p>{state.warning}</p>
          {state.reasons && state.reasons.length > 0 && (
            <ul className="list-disc space-y-1 pl-4">
              {state.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {state.error && (
        <div className="space-y-2 text-xs text-red-600">
          <p>{state.error}</p>
          {state.blockedPosts && state.blockedPosts.length > 0 && (
            <ul className="list-disc space-y-1 pl-4">
              {state.blockedPosts.map((post) => (
                <li key={post.path}>
                  <Link
                    href={`/sites/${siteId}/posts/edit?path=${encodeURIComponent(post.path)}`}
                    className="underline hover:text-red-800"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ProgressButton
        expectedSeconds={4}
        pendingLabel="保存中"
        className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
      >
        {showConfirm ? "确认仍要保存" : "保存"}
      </ProgressButton>
    </form>
  );
}
