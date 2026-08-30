"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { savePublishCheckAction, type SavePublishCheckState } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import {
  DEFAULT_PUBLISH_CHECK_INTERVAL,
  ESTIMATED_MINUTES_PER_SCHEDULED_RUN,
  estimatePublishCheck,
  estimateSaveMinutes,
  getPublishCheckInterval,
  PUBLISH_CHECK_INTERVALS,
  PUBLISH_CHECK_QUOTA_MINUTES,
  projectQuotaUsage,
  publishCheckConfirmKey,
  QUOTA_CAUTION_PERCENT,
  recommendPublishCheckInterval,
  remainingSaveCount,
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
  const [savesInput, setSavesInput] = useState("");
  const [state, formAction] = useActionState<SavePublishCheckState, FormData>(
    savePublishCheckAction,
    {},
  );
  const savesPerMonth = savesInput.trim() === "" ? null : Math.max(0, Math.round(Number(savesInput) || 0));
  const saveMinutes = savesPerMonth == null ? 0 : estimateSaveMinutes(savesPerMonth);
  const projection = useMemo(
    () =>
      projectQuotaUsage({
        enabled: on,
        interval: choice,
        isPrivate: dataRepoPrivate,
        otherMinutes: otherPrivateMinutes,
        saveMinutes,
        otherChecks,
        accountUsedMinutes,
      }),
    [accountUsedMinutes, choice, dataRepoPrivate, on, otherChecks, otherPrivateMinutes, saveMinutes],
  );
  const recommended = recommendPublishCheckInterval(savesPerMonth, otherPrivateMinutes);
  const clockMinutes = projection.thisMinutes + projection.otherMinutes;
  const clockPercent = Math.round((clockMinutes / PUBLISH_CHECK_QUOTA_MINUTES) * 100);
  const savesLeft = remainingSaveCount(clockMinutes);
  const recommendedLabel = intervalLabel(recommended);
  const selectedMeta = PUBLISH_CHECK_INTERVALS.find((item) => item.id === choice);
  const multiSite = sameAccountSiteCount > 1;
  const showQuota = dataRepoPrivate;
  const overCaution = showQuota && on && clockPercent >= QUOTA_CAUTION_PERCENT;
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
              打开后按间隔构建。打字不耗时长，点保存才耗。
            </li>
            <li>
              <span className="font-medium text-neutral-800">
                每次构建约 {ESTIMATED_MINUTES_PER_SCHEDULED_RUN} 分钟
              </span>
              ，多站共用同一帐户额度。能接受更粗的延迟，就能给点保存留更多时长。
            </li>
          </ul>

          {showQuota && (
            <div>
              <p className="text-[11px] font-medium text-neutral-600">帐户检查合计（本站 + 其他站）</p>
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
                </div>
              </div>
              <p
                className={`mt-1.5 text-[11px] leading-relaxed ${
                  overCaution ? "text-amber-800" : "text-neutral-500"
                }`}
              >
                检查约 {formatMinutes(clockMinutes)} / {PUBLISH_CHECK_QUOTA_MINUTES}，占{" "}
                <span className="font-medium">{clockPercent}%</span>
                {projection.otherMinutes > 0 ? "（灰=其他站，强调色=本站）" : ""}
                。按 80% 留一点给点保存，大约还能再保存 {savesLeft} 次。
                {overCaution ? ` 已超过 ${QUOTA_CAUTION_PERCENT}%，保存设置前会请你确认。` : ""}
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
              <span>按保存次数估一下还剩多少</span>
              <span className="text-neutral-400">{estimatorOpen ? "收起" : "展开"}</span>
            </button>
            {estimatorOpen && (
              <div className="space-y-3 border-t border-neutral-100 px-3 py-3 text-xs leading-relaxed text-neutral-600">
                <label className="block">
                  <span className="text-neutral-500">
                    这个站每月大概会点多少次保存？（改稿再存也算。打字、本地底稿不算。可留空。）
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={savesInput}
                    onChange={(event) => setSavesInput(event.target.value)}
                    placeholder="例如 20"
                    className="mt-1 w-28 rounded border border-neutral-300 px-2 py-1.5"
                  />
                </label>
                <p>
                  日常保存
                  {savesPerMonth == null ? (
                    <>：没填次数就不估这一笔。打字不耗 Actions。</>
                  ) : (
                    <>
                      ：{savesPerMonth} 次 × 约 {ESTIMATED_MINUTES_PER_SCHEDULED_RUN} 分钟 ≈{" "}
                      <span className="font-medium text-neutral-800">{formatMinutes(saveMinutes)}</span>
                    </>
                  )}
                </p>
                <p>
                  各站检查：本站 {formatMinutes(projection.thisMinutes)}
                  {projection.otherMinutes > 0
                    ? ` + 其他站 ${formatMinutes(projection.otherMinutes)}`
                    : ""}
                  {` = ${formatMinutes(clockMinutes)}`}
                  {showQuota
                    ? `，约占 ${Math.round((clockMinutes / PUBLISH_CHECK_QUOTA_MINUTES) * 100)}%。`
                    : "。"}
                </p>
                <p>
                  按 80% 给点保存留余量，当前检查档大约还能再保存{" "}
                  <span className="font-medium text-neutral-800">{savesLeft} 次</span>。
                  {savesPerMonth != null && savesPerMonth > savesLeft
                    ? " 你填的次数已经多于这个余量，建议换更宽的间隔。"
                    : ""}
                  {accountUsedMinutes != null
                    ? ` 帐户本月已用约 ${Math.round(accountUsedMinutes)} 分钟（和整月预估不是同一笔账）。`
                    : ""}
                </p>
                <p>
                  {savesPerMonth == null
                    ? "没填保存次数时，只按各站检查来建议。"
                    : "建议会先扣掉你填的保存次数，再看检查还能开多密。"}{" "}
                  有余量可以到 1 小时；其他站已经占了很多，或你保存很勤，就会放宽。
                  当前建议{" "}
                  <span className="font-medium text-neutral-800">{recommendedLabel}</span>。
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
