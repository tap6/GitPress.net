"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";
import { generateSummaryAction, savePostAction, type SavePostState } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import { RichTextEditor } from "@/components/RichTextEditor";
import type { SiteCategory } from "@/lib/content";
import {
  isEmptyDraft,
  useLocalPostDraft,
  type LocalDraftFields,
} from "@/lib/localDraft";
import { clearPendingMedia, writePendingMedia } from "@/lib/pendingMedia";

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

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
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState("");
  const [date, setDate] = useState(initial?.date ?? today);
  const [draft, setDraft] = useState(initial?.draft ?? false);
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [editorKey, setEditorKey] = useState(0);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const pendingFilesRef = useRef<File[]>([]);

  const fields: LocalDraftFields = {
    title,
    slug,
    date,
    draft,
    tags,
    category,
    description,
    body,
  };

  const local = useLocalPostDraft(siteId, path, fields, (next) => {
    setTitle(next.title);
    setSlug(next.slug);
    setDate(next.date);
    setDraft(next.draft);
    setTags(next.tags);
    setCategory(next.category);
    setDescription(next.description);
    setBody(next.body);
    setEditorKey((key) => key + 1);
  });

  const localRef = useRef(local);
  localRef.current = local;
  const boundSave = useMemo(
    () => async (prev: SavePostState, formData: FormData) => {
      const bodyText = String(formData.get("body") ?? "");
      const snapshot = pendingFilesRef.current.filter((file) =>
        bodyText.includes(`/media/${file.name}`),
      );
      for (const file of snapshot) {
        formData.append("media", file, file.name);
      }
      localRef.current.clearForSubmit();
      await clearPendingMedia(siteId, path);
      try {
        const result = await savePostAction(prev, formData);
        if (result?.error) {
          localRef.current.persistNow();
          await writePendingMedia(
            siteId,
            path,
            snapshot.map((file) => ({ name: file.name, type: file.type, blob: file })),
          );
        }
        return result;
      } catch (error) {
        if (!isNextRedirectError(error)) {
          localRef.current.persistNow();
          await writePendingMedia(
            siteId,
            path,
            snapshot.map((file) => ({ name: file.name, type: file.type, blob: file })),
          );
        }
        throw error;
      }
    },
    [path, siteId],
  );
  const [state, formAction] = useActionState<SavePostState, FormData>(boundSave, {});

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

  const settingsHref = `/sites/${siteId}/settings#account-ai`;
  const savedLabel =
    local.lastSavedAt != null
      ? `本地底稿 ${new Date(local.lastSavedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
      : null;
  const showLocalDraftHint = !isEmptyDraft(fields);

  return (
    <form action={formAction} className="flex flex-col gap-6 lg:max-w-6xl lg:flex-row">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="path" value={path} />

      {/* Main column */}
      <div className="min-w-0 flex-1 space-y-4">
        {local.pending && (
          <div className="rounded border-l-4 border-sky-500 bg-sky-50 p-3 text-sm text-sky-900">
            <p>
              这个浏览器里有一份未提交的底稿
              {local.pending.savedAt
                ? `（${new Date(local.pending.savedAt).toLocaleString("zh-CN")}）`
                : ""}
              ,切换标签或刷新前写过的内容还在。
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={local.restorePending}
                className="rounded bg-sky-700 px-3 py-1 text-xs font-medium text-white hover:bg-sky-800"
              >
                恢复底稿
              </button>
              <button
                type="button"
                onClick={() => {
                  void clearPendingMedia(siteId, path);
                  local.discardPending();
                }}
                className="text-xs text-sky-700 hover:underline"
              >
                丢弃,用仓库里的版本
              </button>
            </div>
          </div>
        )}
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="在此输入标题"
          className="w-full rounded border border-neutral-300 bg-white px-4 py-3 text-lg shadow-sm focus:border-wp-accent focus:outline-none"
        />
        {!path && (
          <input
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="URL 标识(留空由标题自动生成,建议英文)"
            className="w-full rounded border border-neutral-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-wp-accent focus:outline-none"
          />
        )}
        <RichTextEditor
          key={editorKey}
          name="body"
          siteId={siteId}
          draftKey={path}
          defaultValue={body}
          onChange={setBody}
          onPendingMediaChange={(files) => {
            pendingFilesRef.current = files;
            setPendingCount(files.length);
          }}
          placeholder="开始写作…"
        />
        {showLocalDraftHint && (
          <p className="text-[11px] text-neutral-400">
            {local.persistOk
              ? savedLabel
                ? `${savedLabel} · 仅存在此浏览器,提交到 GitHub 后才会出现在站点上。`
                : "正在写入本地底稿…"
              : "本地底稿写入失败(可能是浏览器存储已满),请尽快点保存提交到 GitHub。"}
          </p>
        )}
        {state.error && (
          <p className="rounded bg-red-50 p-3 text-sm text-red-600">{state.error}</p>
        )}
      </div>

      {/* Sidebar: publish box */}
      <div className="w-full space-y-4 lg:w-72 lg:shrink-0">
        <div className="rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-4 py-2.5 text-sm font-semibold">发布</h2>
          <div className="space-y-3 p-4 text-sm">
            <label className="block">
              <span className="text-neutral-500">状态</span>
              <select
                value={draft ? "draft" : "publish"}
                onChange={(e) => setDraft(e.target.value === "draft")}
                className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
              >
                <option value="publish">已发布(公开站点可见)</option>
                <option value="draft">草稿 · 不公开(不进入构建)</option>
              </select>
            </label>
            {draft && <input type="hidden" name="draft" value="on" />}
            <label className="block">
              <span className="text-neutral-500">日期</span>
              <input
                type="date"
                name="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5"
              />
            </label>
            <ProgressButton
              expectedSeconds={5 + pendingCount * 2}
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
              >
                <option value="">未分类</option>
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.label}
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
                value={tags}
                onChange={(e) => setTags(e.target.value)}
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
                    <Link href={settingsHref} className="underline hover:text-amber-900">
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
