"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { saveSettingsAction, type SaveSettingsState } from "@/lib/actions";
import { FormError } from "@/components/FormError";
import { ProgressButton } from "@/components/ProgressButton";
import { onFormStampAuthorNow } from "@/lib/browserWallClock";
import { COMMON_TIME_ZONES } from "@/lib/timeZones";

interface Props {
  siteId: string;
  initial: {
    name: string;
    description: string;
    language: string;
    author: string;
    timezone: string;
    convertUploadsToWebp: boolean;
  };
}

const TZ_KEYS: Record<string, string> = {
  "Asia/Shanghai": "tzShanghai",
  "Asia/Hong_Kong": "tzHongKong",
  "Asia/Taipei": "tzTaipei",
  "Asia/Tokyo": "tzTokyo",
  "Asia/Seoul": "tzSeoul",
  "Asia/Singapore": "tzSingapore",
  "Asia/Kolkata": "tzKolkata",
  "Asia/Dubai": "tzDubai",
  "Australia/Sydney": "tzSydney",
  "Pacific/Auckland": "tzAuckland",
  "Europe/London": "tzLondon",
  "Europe/Paris": "tzParis",
  "Europe/Berlin": "tzBerlin",
  "Europe/Moscow": "tzMoscow",
  "America/New_York": "tzNewYork",
  "America/Chicago": "tzChicago",
  "America/Denver": "tzDenver",
  "America/Los_Angeles": "tzLosAngeles",
  "America/Toronto": "tzToronto",
  "America/Sao_Paulo": "tzSaoPaulo",
  "Africa/Johannesburg": "tzJohannesburg",
  UTC: "tzUtc",
};

export function SettingsForm({ siteId, initial }: Props) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<SaveSettingsState, FormData>(
    saveSettingsAction,
    {},
  );
  const [timezone, setTimezone] = useState(initial.timezone);
  const zones = useMemo(() => {
    const known = new Set(COMMON_TIME_ZONES.map((item) => item.id));
    if (timezone && !known.has(timezone)) {
      return [{ id: timezone, label: timezone }, ...COMMON_TIME_ZONES];
    }
    return COMMON_TIME_ZONES;
  }, [timezone]);

  useEffect(() => {
    if (initial.timezone) return;
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) setTimezone(detected);
  }, [initial.timezone]);

  useEffect(() => {
    if (window.location.hash !== "#media") return;
    document.getElementById("media")?.scrollIntoView({ block: "nearest" });
  }, []);

  return (
    <form action={formAction} onSubmit={onFormStampAuthorNow} className="space-y-4 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <label className="block">
        <span className="font-medium">{t("siteName")}</span>
        <input
          name="name"
          required
          defaultValue={initial.name}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="font-medium">{t("tagline")}</span>
        <input
          name="description"
          defaultValue={initial.description}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="font-medium">{t("author")}</span>
        <input
          name="author"
          defaultValue={initial.author}
          placeholder={t("authorPlaceholder")}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
        />
        <span className="mt-1 block text-xs text-neutral-400">{t("authorHint")}</span>
      </label>
      <label className="block">
        <span className="font-medium">{t("language")}</span>
        <select
          name="language"
          defaultValue={initial.language}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2"
        >
          <option value="zh-CN">{t("langZh")}</option>
          <option value="en">{t("langEn")}</option>
          <option value="ja">{t("langJa")}</option>
        </select>
      </label>
      <label className="block">
        <span className="font-medium">{t("timezone")}</span>
        <select
          name="timezone"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2"
        >
          {zones.map((zone) => {
            const key = TZ_KEYS[zone.id];
            const label = key && t.has(key) ? t(key) : zone.label;
            return (
              <option key={zone.id} value={zone.id}>
                {label === zone.id ? zone.id : `${label} · ${zone.id}`}
              </option>
            );
          })}
        </select>
        <span className="mt-1 block text-xs text-neutral-400">{t("timezoneHint")}</span>
      </label>
      <label id="media" className="flex scroll-mt-16 items-start gap-3">
        <input
          type="checkbox"
          name="convertUploadsToWebp"
          value="on"
          defaultChecked={initial.convertUploadsToWebp}
          className="mt-0.5 accent-wp-accent"
        />
        <span>
          <span className="font-medium">{t("convertUploadsToWebp")}</span>
          <span className="mt-1 block text-xs text-neutral-400">{t("convertUploadsToWebpHint")}</span>
        </span>
      </label>
      <FormError error={state.error} />
      {state.saved && (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">{tc("savedRebuild")}</p>
      )}
      <ProgressButton
        expectedSeconds={4}
        pendingLabel={tc("saving")}
        buildSiteId={siteId}
        className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
      >
        {t("saveChanges")}
      </ProgressButton>
    </form>
  );
}
