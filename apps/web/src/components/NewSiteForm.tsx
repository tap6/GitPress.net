"use client";

import { useActionState, useState } from "react";
import { createSiteAction, type CreateSiteState } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import { ThemePreviewImage } from "@/components/ThemePreviewImage";
import type { BuiltinTheme } from "@/lib/themes";

interface Props {
  installations: Array<{ id: string; label: string }>;
  themes: BuiltinTheme[];
  connectMoreUrl: string;
}

export function NewSiteForm({ installations, themes, connectMoreUrl }: Props) {
  const [state, formAction] = useActionState<CreateSiteState, FormData>(
    createSiteAction,
    {},
  );
  const [selectedTheme, setSelectedTheme] = useState(themes[0]?.name ?? "");

  return (
    <form action={formAction} className="mt-8 space-y-8">
      {/* Step 1: site info */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="font-semibold">1. 站点信息</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">站点名称 *</span>
            <input
              name="name"
              required
              placeholder="我的博客"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">标识符(仓库名)</span>
            <input
              name="slug"
              placeholder="my-blog(留空自动生成)"
              pattern="[a-z0-9][a-z0-9\-]*"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
            />
            <span className="mt-1 block text-xs text-neutral-400">
              将创建仓库 <code>标识符</code>(公开)与 <code>标识符-data</code>(私有)
            </span>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium">简介</span>
            <input
              name="description"
              placeholder="一句话介绍你的博客"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">语言</span>
            <select
              name="language"
              defaultValue="zh-CN"
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2"
            >
              <option value="zh-CN">中文(简体)</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">GitHub 账号</span>
            <select
              name="installation"
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2"
            >
              {installations.map((installation) => (
                <option key={installation.id} value={installation.id}>
                  {installation.label}
                </option>
              ))}
            </select>
            <a
              href={connectMoreUrl}
              className="mt-1 block text-xs text-wp-accent hover:underline"
            >
              连接其他账号 / 组织 →
            </a>
          </label>
        </div>
      </section>

      {/* Step 2: theme */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="font-semibold">2. 选择主题</h2>
        <p className="mt-1 text-xs text-neutral-400">
          之后可以随时更换,内容不受任何影响。
        </p>
        <input type="hidden" name="theme" value={selectedTheme} />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {themes.map((theme) => (
            <button
              key={theme.name}
              type="button"
              onClick={() => setSelectedTheme(theme.name)}
              className={`overflow-hidden rounded-xl border-2 text-left transition ${
                selectedTheme === theme.name
                  ? "border-wp-accent shadow-md"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <ThemePreviewImage src={theme.previewSrc} alt={`${theme.displayName} 预览`} className="h-32" />
              <div className="border-t border-neutral-100 bg-white p-3">
                <p className="text-sm font-semibold">{theme.displayName}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{theme.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {state.error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{state.error}</p>
      )}

      <ProgressButton
        expectedSeconds={20}
        pendingLabel="正在初始化仓库与首次构建"
        className="w-full rounded-md bg-gp-brand px-6 py-3 font-semibold text-white hover:opacity-90"
      >
        创建站点
      </ProgressButton>
    </form>
  );
}
