"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { generateSummaryAction, savePostAction, type SavePostState } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import { RichTextEditor } from "@/components/RichTextEditor";
import type { SiteCategory } from "@/lib/content";

interface Props {
  siteId: string;
  /** Existing repo path when editing; empty when creating. */
  path?: string;
  categories?: SiteCategory[];
  initial?: {
    title: string;
    date: string | null;
    draft: boolean;
    tags: string[];
    category?: string | null;
    description: string;
    body: string;
  };
}

export function PostEditor({ siteId, path = "", categories = [], initial }: Props) {
  const [state, formAction] = useActionState<SavePostState, FormData>(
    savePostAction,
    {},
  );
  const today = new Date().toISOString().slice(0, 10);
  const [body, setBody] = useState(initial?.body ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  async function handleGenerateSummary() {
    setSummarizing(true);
    setSummaryError(null);
    const result = await generateSummaryAction(siteId, body);
    setSummarizing(false);
    if (result.error || !result.summary) {
      setSummaryError(result.error ?? "生成失败");
      return;
    }
    setDescription(result.summary);
  }

  return (
    <form action={formAction} className="flex flex-col gap-6 lg:max-w-6xl lg:flex-row">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="path" value={path} />

      {/* Main column */}
      <div className="min-w-0 flex-1 space-y-4">
        <input
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          placeholder="在此输入标题"
          className="w-full rounded border border-neutral-300 bg-white px-4 py-3 text-lg shadow-sm focus:border-wp-accent focus:outline-none"
        />
        {!path && (
          <input
            name="slug"
            placeholder="URL 标识(留空由标题自动生成,建议英文)"
            className="w-full rounded border border-neutral-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-wp-accent focus:outline-none"
          />
        )}
        <RichTextEditor
          name="body"
          siteId={siteId}
          defaultValue={initial?.body ?? ""}
          onChange={setBody}
          placeholder="开始写作…"
        />
        {state.error && (
          <p className="rounded bg-red-50 p-3 text-sm text-red-600">{state.error}</p>
        )}
      </div>

      {/* Sidebar: publish box */}
      <div className="w-full space-y-4 lg:w-72 lg:shrink-0">
        <div className="rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-4 py-2.5 text-sm font-semibold">发布</h2>
          <div className="space-y-3 p-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="draft"
                defaultChecked={initial?.draft ?? false}
                className="accent-wp-accent"
              />
              保存为草稿(不公开)
            </label>
            <label className="block">
              <span className="text-neutral-500">日期</span>
              <input
                type="date"
                name="date"
                defaultValue={initial?.date ?? today}
                className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5"
              />
            </label>
            <ProgressButton
              expectedSeconds={4}
              pendingLabel="提交中"
              buildSiteId={siteId}
              className="w-full rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
            >
              {path ? "更新" : "发布 / 保存"}
            </ProgressButton>
            <Link
              href={`/sites/${siteId}/posts`}
              className="block text-center text-xs text-neutral-400 hover:text-neutral-600"
            >
              返回列表
            </Link>
          </div>
        </div>

        <div className="rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-4 py-2.5 text-sm font-semibold">元信息</h2>
          <div className="space-y-3 p-4 text-sm">
            <label className="block">
              <span className="text-neutral-500">分类</span>
              <select
                name="category"
                defaultValue={initial?.category ?? ""}
                className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
              >
                <option value="">未分类</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.label}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <Link
                  href={`/sites/${siteId}/categories`}
                  className="mt-1 block text-xs text-wp-accent hover:underline"
                >
                  还没有分类,去创建一个 →
                </Link>
              )}
            </label>
            <label className="block">
              <span className="text-neutral-500">标签(逗号分隔)</span>
              <input
                name="tags"
                defaultValue={initial?.tags.join(", ") ?? ""}
                placeholder="随笔, 技术"
                className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="flex items-center justify-between text-neutral-500">
                摘要
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={summarizing}
                  className="text-xs font-medium text-wp-accent hover:underline disabled:opacity-50"
                >
                  {summarizing ? "生成中…" : "✨ AI 生成摘要"}
                </button>
              </span>
              <textarea
                name="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5"
              />
              {summaryError && (
                <span className="mt-1 block text-xs text-amber-700">
                  {summaryError}{" "}
                  {summaryError.includes("AI 设置") && (
                    <Link href="/account/ai" className="underline hover:text-amber-900">
                      前往配置 →
                    </Link>
                  )}
                </span>
              )}
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
