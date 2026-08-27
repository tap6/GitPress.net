"use client";

import Link from "next/link";
import { useActionState } from "react";
import { savePostAction, type SavePostState } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";

interface Props {
  siteId: string;
  /** Existing repo path when editing; empty when creating. */
  path?: string;
  initial?: {
    title: string;
    date: string | null;
    draft: boolean;
    tags: string[];
    description: string;
    body: string;
  };
}

export function PostEditor({ siteId, path = "", initial }: Props) {
  const [state, formAction] = useActionState<SavePostState, FormData>(
    savePostAction,
    {},
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex max-w-5xl gap-6">
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
        <textarea
          name="body"
          rows={22}
          defaultValue={initial?.body ?? ""}
          placeholder={"用 Markdown 写作…\n\n## 小标题\n\n图片:![说明](/media/文件名.jpg)"}
          className="w-full rounded border border-neutral-300 bg-white px-4 py-3 font-mono text-sm leading-relaxed shadow-sm focus:border-wp-accent focus:outline-none"
        />
        {state.error && (
          <p className="rounded bg-red-50 p-3 text-sm text-red-600">{state.error}</p>
        )}
      </div>

      {/* Sidebar: publish box */}
      <div className="w-64 shrink-0 space-y-4">
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
              <span className="text-neutral-500">标签(逗号分隔)</span>
              <input
                name="tags"
                defaultValue={initial?.tags.join(", ") ?? ""}
                placeholder="随笔, 技术"
                className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="text-neutral-500">摘要</span>
              <textarea
                name="description"
                rows={3}
                defaultValue={initial?.description ?? ""}
                className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5"
              />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
