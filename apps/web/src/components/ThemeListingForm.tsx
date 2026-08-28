"use client";

import { useActionState } from "react";
import { addThemeListingAction, type OpsFormState } from "@/lib/opsActions";

export function ThemeListingForm() {
  const [state, formAction] = useActionState<OpsFormState, FormData>(addThemeListingAction, {});

  return (
    <form action={formAction} className="space-y-3 p-5 text-sm">
      <label className="block">
        <span className="font-medium">GitHub 仓库</span>
        <input
          name="repo"
          required
          placeholder="owner/repo 或 https://github.com/owner/repo/tree/v1"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs focus:border-ops-accent focus:outline-none"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="font-medium">子目录(可选)</span>
          <input
            name="subdir"
            placeholder="themes/my-theme"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs focus:border-ops-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="font-medium">分支 / 标签</span>
          <input
            name="ref"
            placeholder="v1 或 main"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs focus:border-ops-accent focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="font-medium">内部备注(站长不可见)</span>
        <input
          name="notes"
          placeholder="来源、作者、审核说明…"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-xs focus:border-ops-accent focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="font-medium">状态</span>
        <select
          name="status"
          defaultValue="listed"
          className="mt-1 rounded border border-slate-300 bg-white px-2 py-1.5"
        >
          <option value="listed">已上架(站长可见)</option>
          <option value="pending">待审</option>
          <option value="hidden">已下架</option>
        </select>
      </label>
      <p className="text-xs text-slate-400">
        只写入指针 <code>github:owner/repo#ref</code>,主题文件仍在对方仓库。构建时由用户自己的 GitHub
        Actions 拉取,不会装到 GitPress 服务器。
      </p>
      {state.error && <p className="rounded bg-red-50 p-3 text-red-600">{state.error}</p>}
      {state.saved && (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">已加入目录:{state.name}</p>
      )}
      <button
        type="submit"
        className="rounded bg-ops-accent px-4 py-2 font-medium text-white hover:bg-teal-800"
      >
        拉取 theme.json 并加入目录
      </button>
    </form>
  );
}
