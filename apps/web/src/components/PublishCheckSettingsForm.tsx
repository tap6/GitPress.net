"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { savePublishCheckAction, type SavePublishCheckState } from "@/lib/actions";
import { FormError, useFormErrorText } from "@/components/FormError";
import { ProgressButton } from "@/components/ProgressButton";
import { onFormStampAuthorNow } from "@/lib/browserWallClock";
import {
  DEFAULT_PUBLISH_CHECK_INTERVAL,
  ESTIMATED_MINUTES_PER_SCHEDULED_RUN,
  estimatePublishCheck,
  estimateSaveMinutes,
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

const INTERVAL_KEYS: Record<PublishCheckIntervalId, string> = {
  "15m": "interval15m",
  "30m": "interval30m",
  "1h": "interval1h",
  "2h": "interval2h",
  "3h": "interval3h",
  "6h": "interval6h",
  "12h": "interval12h",
  "24h": "interval24h",
};

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
  const t = useTranslations("publish");
  const tc = useTranslations("common");
  const errorText = useFormErrorText();
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
  const intervalName = (id: PublishCheckIntervalId) => t(INTERVAL_KEYS[id]);
  const recommendedLabel = intervalName(recommended);
  const selectedMeta = PUBLISH_CHECK_INTERVALS.find((item) => item.id === choice);
  const multiSite = sameAccountSiteCount > 1;
  const showQuota = dataRepoPrivate;
  const overCaution = showQuota && on && clockPercent >= QUOTA_CAUTION_PERCENT;
  const currentConfirmKey = publishCheckConfirmKey(on, on ? choice : null);
  const showConfirm = Boolean(state.needsConfirm && state.confirmKey === currentConfirmKey);
  const minutesText = (value: number) => tc("minutes", { n: value });

  function delayHint(minutes: number): string {
    if (minutes < 60) return t("delayMinutes", { n: minutes });
    if (minutes === 60) return t("delayHour");
    if (minutes < 1440) return t("delayHours", { n: minutes / 60 });
    return t("delayDay");
  }

  return (
    <form action={formAction} onSubmit={onFormStampAuthorNow} className="space-y-4 p-5 text-sm">
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
          <span className="font-medium text-neutral-800">{t("title")}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{t("lead")}</span>
        </span>
      </label>

      {multiSite && (
        <p className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-600">
          {t("otherSites", { account: accountLogin, n: sameAccountSiteCount - 1 })}
          {otherChecks.length > 0 ? (
            <>
              {" "}
              {t("othersOn")}
              {otherChecks.map((site, index) => (
                <span key={site.siteId}>
                  {index > 0 ? " · " : " "}
                  <Link
                    href={`/sites/${site.siteId}/settings#publish`}
                    className="text-wp-accent hover:underline"
                  >
                    {site.name}
                  </Link>
                  {t("otherSiteMeta", {
                    interval: intervalName(site.interval),
                    minutes: minutesText(site.minutesPerMonth),
                  })}
                </span>
              ))}
              {t("othersStack")}
            </>
          ) : (
            t("othersLater")
          )}
        </p>
      )}

      {on && (
        <div className="space-y-4 rounded border border-neutral-100 bg-neutral-50 p-4">
          <label className="block">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-medium">{t("interval")}</span>
              <span className="text-[11px] text-neutral-500">{t("intervalHint")}</span>
            </span>
            <select
              name="interval"
              value={choice}
              onChange={(event) => setChoice(event.target.value as PublishCheckIntervalId)}
              className="mt-1.5 w-full rounded border border-neutral-300 bg-white px-3 py-2"
            >
              {PUBLISH_CHECK_INTERVALS.map((item) => (
                <option key={item.id} value={item.id}>
                  {intervalName(item.id)}
                  {item.id === SUGGESTED_PUBLISH_CHECK_INTERVAL ? t("suggestedMark") : ""}
                  {` · ${delayHint(item.minutes)}`}
                </option>
              ))}
            </select>
          </label>

          <ul className="space-y-1 text-xs leading-relaxed text-neutral-500">
            <li>
              <span className="font-medium text-neutral-800">{t("notExact")}</span>
              {t("notExactBody", { hint: delayHint(selectedMeta?.minutes ?? 120) })}
            </li>
            <li>
              <span className="font-medium text-neutral-800">{t("alwaysRuns")}</span>
              {t("alwaysRunsBody")}
            </li>
            <li>
              <span className="font-medium text-neutral-800">
                {t("eachRun", { n: ESTIMATED_MINUTES_PER_SCHEDULED_RUN })}
              </span>
              {t("eachRunBody")}
            </li>
          </ul>

          {showQuota && (
            <div>
              <p className="text-[11px] font-medium text-neutral-600">{t("accountTotal")}</p>
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
                {t("quotaLine", {
                  used: minutesText(clockMinutes),
                  cap: PUBLISH_CHECK_QUOTA_MINUTES,
                  percent: clockPercent,
                })}
                {projection.otherMinutes > 0 ? t("quotaLegend") : ""}
                {t("quotaSaves", { n: savesLeft })}
                {overCaution ? t("overCaution", { percent: QUOTA_CAUTION_PERCENT }) : ""}
              </p>
            </div>
          )}

          <div>
            <p className="text-[11px] font-medium text-neutral-600">
              {showQuota ? t("chartPrivate") : t("chartPublic")}
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
                        {intervalName(item.id)}
                        {suggested ? <span className="text-neutral-400"> · {tc("suggested")}</span> : null}
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
                        {showQuota ? `${shownPercent}%` : t("runsCount", { n: row.runsPerMonth })}
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
              <span>{t("estimator")}</span>
              <span className="text-neutral-400">{estimatorOpen ? tc("collapse") : tc("expand")}</span>
            </button>
            {estimatorOpen && (
              <div className="space-y-3 border-t border-neutral-100 px-3 py-3 text-xs leading-relaxed text-neutral-600">
                <label className="block">
                  <span className="text-neutral-500">{t("savesAsk")}</span>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={savesInput}
                    onChange={(event) => setSavesInput(event.target.value)}
                    placeholder={t("savesPlaceholder")}
                    className="mt-1 w-28 rounded border border-neutral-300 px-2 py-1.5"
                  />
                </label>
                <p>
                  {t("dailySaves")}
                  {savesPerMonth == null
                    ? t("dailySavesEmpty")
                    : t("dailySavesCalc", {
                        n: savesPerMonth,
                        mins: ESTIMATED_MINUTES_PER_SCHEDULED_RUN,
                        total: minutesText(saveMinutes),
                      })}
                </p>
                <p>
                  {t("checksLine", { this: minutesText(projection.thisMinutes) })}
                  {projection.otherMinutes > 0
                    ? t("plusOthers", { other: minutesText(projection.otherMinutes) })
                    : ""}
                  {t("equals", { total: minutesText(clockMinutes) })}
                  {showQuota
                    ? t("aboutPercent", {
                        percent: Math.round((clockMinutes / PUBLISH_CHECK_QUOTA_MINUTES) * 100),
                      })
                    : "."}
                </p>
                <p>
                  {t("savesLeft", { n: savesLeft })}
                  {savesPerMonth != null && savesPerMonth > savesLeft ? t("savesOver") : ""}
                  {accountUsedMinutes != null
                    ? t("accountUsed", { n: Math.round(accountUsedMinutes) })
                    : ""}
                </p>
                <p>
                  {savesPerMonth == null ? t("recommendEmpty") : t("recommendFilled")}{" "}
                  {t("recommendHint", { label: recommendedLabel })}
                </p>
                {recommended !== choice && (
                  <button
                    type="button"
                    onClick={() => setChoice(recommended)}
                    className="rounded border border-neutral-300 px-3 py-1.5 font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    {t("useRecommend", { label: recommendedLabel })}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-neutral-400">
        <Link href="/help/drafts-and-builds" className="text-wp-accent hover:underline" target="_blank">
          {t("help")}
        </Link>
      </p>

      {showConfirm && state.warning && (
        <div className="space-y-2 rounded border border-amber-300 bg-amber-50 px-3 py-3 text-xs leading-relaxed text-amber-950">
          <p className="font-medium">{t("cautionTitle")}</p>
          <p>{errorText(state.warning)}</p>
          {state.reasons && state.reasons.length > 0 && (
            <ul className="list-disc space-y-1 pl-4">
              {state.reasons.map((reason) => (
                <li key={reason}>{errorText(reason)}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {state.error && (
        <div className="space-y-2 text-xs text-red-600">
          <FormError error={state.error} className="p-0 bg-transparent text-xs text-red-600" />
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
        pendingLabel={tc("saving")}
        className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
      >
        {showConfirm ? t("confirmSave") : tc("save")}
      </ProgressButton>
    </form>
  );
}
