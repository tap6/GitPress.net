"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { savePublishCheckAction, type SavePublishCheckState } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import {
  DEFAULT_PUBLISH_CHECK_INTERVAL,
  ESTIMATED_MINUTES_PER_SCHEDULED_RUN,
  estimatePublishCheck,
  PUBLISH_CHECK_INTERVALS,
  PUBLISH_CHECK_QUOTA_MINUTES,
  type PublishCheckIntervalId,
} from "@/lib/publishCheck";

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
  const [state, formAction] = useActionState<SavePublishCheckState, FormData>(
    savePublishCheckAction,
    {},
  );
  const estimate = useMemo(() => estimatePublishCheck(choice), [choice]);

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
            关闭时不能把文章日期选到现在之后。打开后，GitHub 会按间隔再构建一次，到期的稿才会出现在公开站点。这是检查间隔，不是对准文章上的那一分钟。
          </span>
        </span>
      </label>

      {on && (
        <div className="space-y-3 rounded border border-neutral-100 bg-neutral-50 p-4">
          <label className="block">
            <span className="font-medium">检查间隔</span>
            <select
              name="interval"
              value={choice}
              onChange={(event) => setChoice(event.target.value as PublishCheckIntervalId)}
              className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2"
            >
              {PUBLISH_CHECK_INTERVALS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          {dataRepoPrivate ? (
            <p
              className={`text-xs leading-relaxed ${
                estimate.percentOfQuota > 100 ? "text-red-700" : "text-neutral-500"
              }`}
            >
              按每次约 {ESTIMATED_MINUTES_PER_SCHEDULED_RUN} 分钟、一个月 30
              天估算：约每月 {estimate.runsPerMonth} 次，约 {estimate.minutesPerMonth}{" "}
              分钟，约占 GitHub 私有仓免费 {PUBLISH_CHECK_QUOTA_MINUTES} 分钟的{" "}
              {estimate.percentOfQuota}%。这是估算，不是账单；额度按整个帐户的私有仓 Actions
              合计，GitHub 按每次任务向上取整。GitHub 用 UTC，忙时可能再偏一会儿。
              {estimate.percentOfQuota > 100 ? " 这个间隔会超过常见免费额度。" : ""}
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-neutral-500">
              当前数据仓是公开的，标准 runner 通常不占帐户那 {PUBLISH_CHECK_QUOTA_MINUTES}{" "}
              分钟。间隔仍决定到点后最多再等多久。GitHub 用 UTC，忙时可能再偏一会儿。
            </p>
          )}
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
