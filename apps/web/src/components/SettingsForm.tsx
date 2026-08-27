"use client";

import { useActionState } from "react";
import { saveSettingsAction, type SaveSettingsState } from "@/lib/actions";

interface Props {
  siteId: string;
  initial: { name: string; description: string; language: string };
}

export function SettingsForm({ siteId, initial }: Props) {
  const [state, formAction, pending] = useActionState<SaveSettingsState, FormData>(
    saveSettingsAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4 p-5 text-sm">
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
      {state.error && <p className="rounded bg-red-50 p-3 text-red-600">{state.error}</p>}
      {state.saved && (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">
          已保存,站点将在约 1 分钟后更新。
        </p>
      )}
      <button
        disabled={pending}
        className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark disabled:opacity-50"
      >
        {pending ? "保存中…" : "保存更改"}
      </button>
    </form>
  );
}
