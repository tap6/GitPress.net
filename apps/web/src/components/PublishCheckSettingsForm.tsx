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
  PUBLISH_CHECK_INTERVALS,
  PUBLISH_CHECK_QUOTA_MINUTES,
  recommendPublishCheckInterval,
  SUGGESTED_PUBLISH_CHECK_INTERVAL,
  type PublishCheckIntervalId,
} from "@/lib/publishCheck";

function delayHint(minutes: number): string {
  if (minutes < 60) return `最多再等约 ${minutes} 分钟`;
  if (minutes === 60) return "最多再等约 1 小时";
  if (minutes < 1440) return `最多再等约 ${minutes / 60} 小时`;
  return "最多再等约 1 天";
}

function barTone(percent: number, selected: boolean): string {
  if (selected) return percent > 100 ? "bg-red-600" : percent >= 70 ? "bg-amber-500" : "bg-wp-accent";
  if (percent > 100) return "bg-red-200";
  if (percent >= 70) return "bg-amber-200";
  return "bg-neutral-300";
}

function formatMinutes(value: number): string {
  return `${value} 分钟`;
}

export function PublishCheckSettingsForm({
  siteId,
  enabled,
  interval,
  dataRepoPrivate,
}: {
  siteId: string;
  enabled: boolean;
  interval: PublishCheckIntervalId | null;
  dataRepoPrivate: boolean;
}) {
  const [on, setOn] = useState(enabled);
  const [choice, setChoice] = useState<PublishCheckIntervalId>(
    interval ?? DEFAULT_PUBLISH_CHECK_INTERVAL,
  );
  const [estimatorOpen, setEstimatorOpen] = useState(false);
  const [postsPerMonth, setPostsPerMonth] = useState(DEFAULT_ESTIMATE_POSTS_PER_MONTH);
  const [state, formAction] = useActionState<SavePublishCheckState, FormData>(
    savePublishCheckAction,
    {},
  );
  const estimate = useMemo(() => estimatePublishCheck(choice), [choice]);
  const writingMinutes = estimateWritingMinutes(postsPerMonth);
  const recommended = recommendPublishCheckInterval(postsPerMonth);
  const recommendedEstimate = estimatePublishCheck(recommended);
  const recommendedLabel =
    PUBLISH_CHECK_INTERVALS.find((item) => item.id === recommended)?.label ?? recommended;
  const totalWithWriting = writingMinutes + estimate.minutesPerMonth;
  const totalPercent = Math.round((totalWithWriting / PUBLISH_CHECK_QUOTA_MINUTES) * 100);
  const selectedMeta = PUBLISH_CHECK_INTERVALS.find((item) => item.id === choice);

  return (
    <form action={formAction} className="space-y-4 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
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

      {on && (
        <div className="space-y-4 rounded border border-neutral-100 bg-neutral-50 p-4">
          <label className="block">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-medium">检查间隔</span>
              <span className="text-[11px] text-neutral-500">
                建议选
                <span className="font-medium text-neutral-800"> 每 2 小时</span>
                ：多数博客够用，大约只占免费额度的 36%。1 小时更准，但大约会占到 72%。
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
              打开后按间隔构建，和这个月写几篇无关。
            </li>
            <li>
              <span className="font-medium text-neutral-800">
                每次约 {ESTIMATED_MINUTES_PER_SCHEDULED_RUN} 分钟
              </span>
              （GitHub 按任务向上取整）。能接受更粗的延迟，就能省下更多 Actions。
            </li>
          </ul>

          <div>
            <p className="text-[11px] font-medium text-neutral-600">
              {dataRepoPrivate ? "各间隔预计占用免费 2000 分钟" : "各间隔预计检查次数（公开仓通常不占这 2000）"}
            </p>
            <ul className="mt-2 space-y-1.5">
              {PUBLISH_CHECK_INTERVALS.map((item) => {
                const row = estimatePublishCheck(item.id);
                const selected = item.id === choice;
                const suggested = item.id === SUGGESTED_PUBLISH_CHECK_INTERVAL;
                const width = Math.min(100, row.percentOfQuota);
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
                          className={`block h-full rounded-full ${barTone(row.percentOfQuota, selected)}`}
                          style={{ width: `${Math.max(width, row.percentOfQuota > 0 ? 4 : 0)}%` }}
                        />
                      </span>
                      <span
                        className={`tabular-nums ${
                          row.percentOfQuota > 100
                            ? "font-medium text-red-700"
                            : selected
                              ? "text-neutral-800"
                              : "text-neutral-500"
                        }`}
                      >
                        {dataRepoPrivate ? `${row.percentOfQuota}%` : `${row.runsPerMonth} 次`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {dataRepoPrivate ? (
              <p
                className={`mt-2 text-[11px] leading-relaxed ${
                  estimate.percentOfQuota > 100 ? "text-red-700" : "text-neutral-500"
                }`}
              >
                当前{" "}
                <span className="font-medium text-neutral-800">{selectedMeta?.label}</span>
                ：约每月 {estimate.runsPerMonth} 次，约{" "}
                <span className="font-medium text-neutral-800">{formatMinutes(estimate.minutesPerMonth)}</span>
                ，占免费额度约{" "}
                <span className="font-medium text-neutral-800">{estimate.percentOfQuota}%</span>
                。这是估算，额度按整个帐户的私有仓合计。
                {estimate.percentOfQuota > 100 ? " 这个间隔会超过常见免费额度。" : ""}
              </p>
            ) : (
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
                当前数据仓是公开的，标准 runner 通常不占那 {PUBLISH_CHECK_QUOTA_MINUTES}{" "}
                分钟。间隔仍决定到点后最多再等多久。
              </p>
            )}
          </div>

          <div className="rounded border border-neutral-200 bg-white">
            <button
              type="button"
              onClick={() => setEstimatorOpen((open) => !open)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-neutral-700"
              aria-expanded={estimatorOpen}
            >
              <span>按写作量估一下，并给出建议</span>
              <span className="text-neutral-400">{estimatorOpen ? "收起" : "展开"}</span>
            </button>
            {estimatorOpen && (
              <div className="space-y-3 border-t border-neutral-100 px-3 py-3 text-xs leading-relaxed text-neutral-600">
                <label className="block">
                  <span className="text-neutral-500">每月大约写几篇文章</span>
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
                  保存文章大约{" "}
                  <span className="font-medium text-neutral-800">{formatMinutes(writingMinutes)}</span>
                  （按每篇保存 {ESTIMATED_SAVES_PER_POST} 次、每次约 {ESTIMATED_MINUTES_PER_SCHEDULED_RUN}{" "}
                  分钟）。检查间隔是另算的：打开后每个间隔都会跑，不随篇数变少。
                </p>
                <p>
                  写作 {formatMinutes(writingMinutes)} + 当前检查 {formatMinutes(estimate.minutesPerMonth)} ≈{" "}
                  <span className="font-medium text-neutral-800">{formatMinutes(totalWithWriting)}</span>
                  {dataRepoPrivate ? `，约占免费额度 ${totalPercent}%。` : "。"}
                </p>
                <p>
                  按这个量，建议选{" "}
                  <span className="font-medium text-neutral-800">{recommendedLabel}</span>
                  （检查约 {formatMinutes(recommendedEstimate.minutesPerMonth)}
                  {dataRepoPrivate ? `，约 ${recommendedEstimate.percentOfQuota}%` : ""}
                  ）。写得越多，越适合把间隔放宽，把额度留给保存。
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
        保存
      </ProgressButton>
    </form>
  );
}
