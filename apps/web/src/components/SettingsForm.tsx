"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { saveSettingsAction, type SaveSettingsState } from "@/lib/actions";
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
  };
}

export function SettingsForm({ siteId, initial }: Props) {
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

  return (
    <form action={formAction} onSubmit={onFormStampAuthorNow} className="space-y-4 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <label className="block">
        <span className="font-medium">站点名称</span>
        <input
          name="name"
          required
          defaultValue={initial.name}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="font-medium">简介</span>
        <input
          name="description"
          defaultValue={initial.description}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="font-medium">作者(可选)</span>
        <input
          name="author"
          defaultValue={initial.author}
          placeholder="用于版权等署名,不是 GitHub 用户名"
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
        />
        <span className="mt-1 block text-xs text-neutral-400">
          留空则页脚版权默认用站点名称。不希望公开 GitHub 账号时,请不要填登录名。
        </span>
      </label>
      <label className="block">
        <span className="font-medium">语言</span>
        <select
          name="language"
          defaultValue={initial.language}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2"
        >
          <option value="zh-CN">中文(简体)</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
      </label>
      <label className="block">
        <span className="font-medium">时区</span>
        <select
          name="timezone"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2"
        >
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.label === zone.id ? zone.id : `${zone.label} · ${zone.id}`}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-neutral-400">
          公开站点按此时区显示日期，无时区的旧文章也按此时区判断是否到期。编辑器里选的时间仍是你电脑上的当地时间。
        </span>
      </label>
      {state.error && <p className="rounded bg-red-50 p-3 text-red-600">{state.error}</p>}
      {state.saved && (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">
          已保存,站点将在约 1 分钟后更新。
        </p>
      )}
      <ProgressButton
        expectedSeconds={4}
        pendingLabel="保存中"
        buildSiteId={siteId}
        className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
      >
        保存更改
      </ProgressButton>
    </form>
  );
}
