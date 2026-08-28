"use client";

import { useActionState } from "react";
import { ProgressButton } from "@/components/ProgressButton";
import { importThemeAction, type ImportThemeState } from "@/lib/actions";

export function ThemeImportForm({ siteId }: { siteId: string }) {
  const [state, formAction] = useActionState<ImportThemeState, FormData>(importThemeAction, {});

  return (
    <form action={formAction} className="space-y-3 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor="theme-import-repo" className="font-medium">
            GitHub 仓库
          </label>
          <a
            href="/help/import-theme"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-wp-accent hover:underline"
          >
            导入是怎么工作的? ↗
          </a>
        </div>
        <input
          id="theme-import-repo"
          name="repo"
          required
          placeholder="owner/repo 或 https://github.com/owner/repo/tree/main/themes/my-theme"
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="font-medium">子目录(可选)</span>
          <input
            name="subdir"
            placeholder="themes/my-theme"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="font-medium">分支 / 标签</span>
          <input
            name="ref"
            placeholder="v1 或 main"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
          />
        </label>
      </div>
      <p className="text-xs text-neutral-400">
        仓库需公开,且根目录或子目录里有符合 spec v1 的 <code>theme.json</code>。
        导入只是记下仓库地址,构建时由 GitHub Actions 去拉取,主题不会装到 GitPress 服务器上。{" "}
        <a
          href="/help/import-theme"
          target="_blank"
          rel="noreferrer"
          className="text-wp-accent hover:underline"
        >
          详细说明
        </a>
      </p>
      {state.error && <p className="rounded bg-red-50 p-3 text-red-600">{state.error}</p>}
      {state.saved && (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">
          已导入主题 {state.name},站点将在约 1 分钟后更新。
        </p>
      )}
      <ProgressButton
        expectedSeconds={6}
        pendingLabel="导入中"
        buildSiteId={siteId}
        className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
      >
        导入并启用
      </ProgressButton>
    </form>
  );
}
