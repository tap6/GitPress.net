"use client";

import Link from "next/link";
import { useActionState, useLayoutEffect, useMemo, useRef, useState } from "react";
import { savePageAction, type SavePageState } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  isEmptyDraft,
  useLocalPostDraft,
  type LocalDraftFields,
} from "@/lib/localDraft";
import { clearPendingMedia, writePendingMedia } from "@/lib/pendingMedia";

function isDesktopEditorViewport(): boolean {
  return window.matchMedia("(min-width: 1024px)").matches;
}

function editorFillStorageKey(): string {
  return isDesktopEditorViewport() ? "gitpress.editor.fill.desktop" : "gitpress.editor.fill.mobile";
}

function readEditorFill(): boolean {
  try {
    const stored = localStorage.getItem(editorFillStorageKey());
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    /* private mode */
  }
  return isDesktopEditorViewport();
}

function writeEditorFill(next: boolean): void {
  try {
    localStorage.setItem(editorFillStorageKey(), next ? "1" : "0");
  } catch {
    /* private mode */
  }
}

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
  path?: string;
  /** When the site already has an explicit top nav, new pages can opt in. */
  hasCustomNav?: boolean;
  initial?: {
    title: string;
    description: string;
    body: string;
    slug?: string;
  };
}

export function PageEditor({ siteId, path = "", hasCustomNav = false, initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [addToNav, setAddToNav] = useState(true);
  const [editorKey, setEditorKey] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const pendingFilesRef = useRef<File[]>([]);
  const [fillEditor, setFillEditor] = useState(false);
  const draftKey = path || "content/pages/new";

  useLayoutEffect(() => {
    setFillEditor(readEditorFill());
    const media = window.matchMedia("(min-width: 1024px)");
    function onViewportChange() {
      setFillEditor(readEditorFill());
    }
    media.addEventListener("change", onViewportChange);
    return () => media.removeEventListener("change", onViewportChange);
  }, []);

  function toggleFillEditor() {
    setFillEditor((prev) => {
      const next = !prev;
      writeEditorFill(next);
      return next;
    });
  }

  const fields: LocalDraftFields = {
    title,
    slug,
    date: "",
    draft: false,
    tags: "",
    category: "",
    description,
    body,
  };

  const local = useLocalPostDraft(siteId, draftKey, fields, (next) => {
    setTitle(next.title);
    setSlug(next.slug);
    setDescription(next.description);
    setBody(next.body);
    setEditorKey((key) => key + 1);
  });

  const localRef = useRef(local);
  localRef.current = local;
  const boundSave = useMemo(
    () => async (prev: SavePageState, formData: FormData) => {
      const bodyText = String(formData.get("body") ?? "");
      const snapshot = pendingFilesRef.current.filter((file) =>
        bodyText.includes(`/media/${file.name}`),
      );
      for (const file of snapshot) {
        formData.append("media", file, file.name);
      }
      localRef.current.clearForSubmit();
      await clearPendingMedia(siteId, draftKey);
      try {
        const result = await savePageAction(prev, formData);
        if (result?.error) {
          localRef.current.persistNow();
          await writePendingMedia(
            siteId,
            draftKey,
            snapshot.map((file) => ({ name: file.name, type: file.type, blob: file })),
          );
        }
        return result;
      } catch (error) {
        if (!isNextRedirectError(error)) {
          localRef.current.persistNow();
          await writePendingMedia(
            siteId,
            draftKey,
            snapshot.map((file) => ({ name: file.name, type: file.type, blob: file })),
          );
        }
        throw error;
      }
    },
    [draftKey, siteId],
  );
  const [state, formAction] = useActionState<SavePageState, FormData>(boundSave, {});

  const savedLabel =
    local.lastSavedAt != null
      ? `本地底稿 ${new Date(local.lastSavedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
      : null;
  const showLocalDraftHint = local.dirty && !isEmptyDraft(fields);

  return (
    <form
      action={formAction}
      className={`flex flex-col gap-6 lg:flex-row ${fillEditor ? "min-h-0 flex-1 lg:items-stretch" : ""}`}
    >
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="path" value={path} />

      <div className={`min-w-0 flex-1 ${fillEditor ? "flex min-h-0 flex-col gap-4" : "space-y-4"}`}>
        {local.pending && (
          <div className="shrink-0 rounded border-l-4 border-sky-500 bg-sky-50 p-3 text-sm text-sky-900">
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
                  void clearPendingMedia(siteId, draftKey);
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
          className="w-full shrink-0 rounded border border-neutral-300 bg-white px-4 py-3 text-lg shadow-sm focus:border-wp-accent focus:outline-none"
        />
        <input
          name="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="URL 标识,如 about(留空由标题生成)。公开地址是 /标识/"
          className="w-full shrink-0 rounded border border-neutral-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-wp-accent focus:outline-none"
        />
        {path && (
          <p className="shrink-0 text-[11px] text-neutral-400">
            修改后旧链接会自动生成跳转页,顶栏/页脚里指向本页的项也会跟着改。
          </p>
        )}
        {showLocalDraftHint && (
          <p className="shrink-0 text-[11px] text-neutral-400">
            {local.persistOk
              ? savedLabel
                ? `${savedLabel} · 仅存在此浏览器,提交到 GitHub 后才会出现在站点上。`
                : "正在写入本地底稿…"
              : "本地底稿写入失败(可能是浏览器存储已满),请尽快点保存提交到 GitHub。"}
          </p>
        )}
        {state.error && (
          <p className="shrink-0 rounded bg-red-50 p-3 text-sm text-red-600">{state.error}</p>
        )}
        <RichTextEditor
          key={editorKey}
          name="body"
          siteId={siteId}
          draftKey={draftKey}
          defaultValue={body}
          onChange={setBody}
          onPendingMediaChange={(files) => {
            pendingFilesRef.current = files;
            setPendingCount(files.length);
          }}
          placeholder="开始写作…"
          fill={fillEditor}
          onToggleFill={toggleFillEditor}
        />
      </div>

      <div className={`w-full space-y-4 lg:w-72 lg:shrink-0 ${fillEditor ? "lg:self-start" : ""}`}>
        <div className="rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-4 py-2.5 text-sm font-semibold">发布</h2>
          <div className="space-y-3 p-4 text-sm">
            <p className="text-neutral-500">
              页面没有草稿。保存后会出现在公开站点的
              {path ? " 原地址。" : " /标识/ 。"}
            </p>
            {!path && hasCustomNav && (
              <label className="flex items-start gap-2 text-neutral-600">
                <input
                  type="checkbox"
                  name="addToNav"
                  value="on"
                  checked={addToNav}
                  onChange={(e) => setAddToNav(e.target.checked)}
                  className="mt-0.5 accent-wp-accent"
                />
                <span>加入顶栏菜单</span>
              </label>
            )}
            {!path && !hasCustomNav && (
              <p className="text-xs text-neutral-400">
                还没有自定义过菜单时,全部页面都会出现在顶栏。若只要部分页面进导航,先到「菜单」保存一次。
              </p>
            )}
            <ProgressButton
              expectedSeconds={5 + pendingCount * 2}
              pendingLabel="提交中"
              buildSiteId={siteId}
              className="w-full rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
            >
              {path ? "更新" : "发布"}
            </ProgressButton>
            <Link
              href={`/sites/${siteId}/pages`}
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
              <span className="text-neutral-500">摘要(可选)</span>
              <textarea
                name="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5"
              />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
