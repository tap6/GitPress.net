"use client";

import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { generateDraftAction } from "@/lib/actions";
import { ImageUploadTray, type ImageUploadTask } from "@/components/ImageUploadTray";
import {
  MAX_BATCH_BYTES,
  MAX_BATCH_IMAGES,
  MAX_IMAGE_BYTES,
  uniqueMediaFileName,
} from "@/lib/mediaName";
import { mediaPreviewUrl } from "@/lib/mediaUrl";
import { readPendingMedia, writePendingMedia } from "@/lib/pendingMedia";

interface Props {
  /** Form field name that receives the serialized Markdown on submit. */
  name: string;
  siteId: string;
  /** Existing post path, or empty for a new post — keys IndexedDB pending images. */
  draftKey?: string;
  defaultValue?: string;
  placeholder?: string;
  /** Fires whenever the serialized Markdown changes — lets the parent (e.g. for "AI 生成摘要") read the latest body text. */
  onChange?: (markdown: string) => void;
  onPendingMediaChange?: (files: File[]) => void;
  /** Stretch the writing surface into leftover admin canvas. */
  fill?: boolean;
  onToggleFill?: () => void;
}

function createGitPressImage(siteId: string, previews: Map<string, string>) {
  return Image.extend({
    addNodeView() {
      return ({ node }) => {
        const wrap = document.createElement("span");
        wrap.className = "gp-editor-image-wrap";
        const img = document.createElement("img");
        wrap.appendChild(img);
        const sync = (current: typeof node) => {
          const src = String(current.attrs.src ?? "");
          img.alt = String(current.attrs.alt ?? "");
          const preview = previews.get(src);
          if (preview) {
            img.src = preview;
          } else if (src.startsWith("/media/")) {
            const fileName = src.slice("/media/".length);
            img.src = mediaPreviewUrl(siteId, fileName);
          } else {
            img.src = src;
          }
        };
        sync(node);
        return {
          dom: wrap,
          update(updated) {
            if (updated.type.name !== "image") return false;
            sync(updated);
            return true;
          },
        };
      };
    },
  });
}

function imageFilesFromList(list: FileList | null | undefined): File[] {
  if (!list) return [];
  return [...list].filter((file) => file.type.startsWith("image/"));
}

/**
 * WYSIWYG post editor backed by Tiptap. Content is kept as plain Markdown at
 * all times (via @tiptap/markdown's bidirectional parser/serializer) so the
 * file committed to the data repo stays a normal, portable .md file — this
 * component only changes how the text is authored, not how it's stored.
 *
 * Images are stored as `/media/file.jpg` (what the published site serves).
 * The admin origin cannot load that path, so the node view shows a blob
 * preview until save, then a same-origin proxy afterwards. Files stay in
 * the browser until the post is saved, so N pictures become one Git commit.
 */
export function RichTextEditor({
  name,
  siteId,
  draftKey = "",
  defaultValue = "",
  placeholder,
  onChange,
  onPendingMediaChange,
  fill = false,
  onToggleFill,
}: Props) {
  const [markdown, setMarkdownState] = useState(defaultValue);
  const [mode, setMode] = useState<"rich" | "source">("rich");
  const [tasks, setTasks] = useState<ImageUploadTask[]>([]);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const [paneHeight, setPaneHeight] = useState<number | null>(null);
  const previews = useRef(new Map<string, string>());
  const pendingFiles = useRef(new Map<string, File>());
  const onPendingRef = useRef(onPendingMediaChange);
  onPendingRef.current = onPendingMediaChange;
  const skipInitialUpdate = useRef(true);
  const uploadFilesRef = useRef<(files: File[]) => void>(() => {});

  function emitPending() {
    onPendingRef.current?.([...pendingFiles.current.values()]);
  }

  function persistPending() {
    void writePendingMedia(
      siteId,
      draftKey,
      [...pendingFiles.current.values()].map((file) => ({
        name: file.name,
        type: file.type,
        blob: file,
      })),
    );
  }

  function setMarkdown(value: string) {
    setMarkdownState(value);
    onChange?.(value);
  }

  const imageExtension = useMemo(() => createGitPressImage(siteId, previews.current), [siteId]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      imageExtension,
      Placeholder.configure({ placeholder: placeholder ?? "开始写作…" }),
      Markdown,
    ],
    content: defaultValue,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class:
          "gp-editor w-full max-w-none rounded-b border border-t-0 border-neutral-300 bg-white px-4 py-3 text-sm leading-relaxed focus:outline-none",
      },
      handlePaste(_view, event) {
        const files = imageFilesFromList(event.clipboardData?.files);
        if (files.length === 0) return false;
        event.preventDefault();
        uploadFilesRef.current(files);
        return true;
      },
      handleDrop(_view, event) {
        const files = imageFilesFromList(event.dataTransfer?.files);
        if (files.length === 0) return false;
        event.preventDefault();
        uploadFilesRef.current(files);
        return true;
      },
    },
    onUpdate: ({ editor: current }) => {
      // Tiptap re-serializes Markdown on mount; that is not a user edit.
      if (skipInitialUpdate.current) {
        skipInitialUpdate.current = false;
        return;
      }
      setMarkdown(current.getMarkdown());
    },
  });

  editorRef.current = editor;

  useEffect(() => {
    const map = previews.current;
    return () => {
      for (const url of map.values()) URL.revokeObjectURL(url);
      map.clear();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await readPendingMedia(siteId, draftKey);
      if (cancelled || stored.length === 0) return;
      for (const item of stored) {
        if (pendingFiles.current.has(item.name)) continue;
        const file = new File([item.blob], item.name, { type: item.type || "image/jpeg" });
        pendingFiles.current.set(item.name, file);
        const src = `/media/${item.name}`;
        if (!previews.current.has(src)) {
          const blobUrl = URL.createObjectURL(file);
          previews.current.set(src, blobUrl);
        }
        setTasks((prev) =>
          prev.some((task) => task.id === item.name)
            ? prev
            : [
                ...prev,
                {
                  id: item.name,
                  name: item.name,
                  preview: previews.current.get(src) ?? "",
                  status: "queued",
                },
              ],
        );
      }
      emitPending();
    })();
    return () => {
      cancelled = true;
    };
    // Restore once per editor mount / draft identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, draftKey]);

  function queueImages(files: File[]) {
    const current = editorRef.current;
    if (!current || files.length === 0) return;

    let queuedBytes = [...pendingFiles.current.values()].reduce((sum, file) => sum + file.size, 0);
    let queuedCount = pendingFiles.current.size;

    for (const file of files) {
      if (file.size > MAX_IMAGE_BYTES) {
        setTasks((prev) => [
          ...prev,
          {
            id: `${file.name}-too-big-${Date.now()}`,
            name: file.name,
            preview: "",
            status: "error",
            error: "单个文件最大 8MB",
          },
        ]);
        continue;
      }
      if (queuedCount >= MAX_BATCH_IMAGES) {
        setTasks((prev) => [
          ...prev,
          {
            id: `${file.name}-too-many-${Date.now()}`,
            name: file.name,
            preview: "",
            status: "error",
            error: `一次最多 ${MAX_BATCH_IMAGES} 张,请先保存文章`,
          },
        ]);
        continue;
      }
      if (queuedBytes + file.size > MAX_BATCH_BYTES) {
        setTasks((prev) => [
          ...prev,
          {
            id: `${file.name}-too-heavy-${Date.now()}`,
            name: file.name,
            preview: "",
            status: "error",
            error: "待提交图片合计不超过 20MB",
          },
        ]);
        continue;
      }

      const fileName = uniqueMediaFileName(file.name);
      const src = `/media/${fileName}`;
      const named = new File([file], fileName, { type: file.type });
      const blobUrl = URL.createObjectURL(named);
      previews.current.set(src, blobUrl);
      pendingFiles.current.set(fileName, named);
      queuedBytes += named.size;
      queuedCount += 1;
      setTasks((prev) => [
        ...prev,
        { id: fileName, name: file.name, preview: blobUrl, status: "queued" },
      ]);
      current.chain().focus().setImage({ src, alt: file.name.replace(/\.[^.]+$/, "") }).run();
    }
    emitPending();
    persistPending();
  }

  uploadFilesRef.current = (files) => {
    queueImages(files);
  };

  function switchToSource() {
    if (editor) setMarkdown(editor.getMarkdown());
    setMode("source");
  }

  function switchToRich() {
    editor?.commands.setContent(markdown, { contentType: "markdown" });
    setMode("rich");
  }

  async function handleGenerateDraft() {
    if (!editor) return;
    const topic = window.prompt("输入主题或要点,AI 会在光标处插入一段 Markdown 初稿:");
    if (!topic || !topic.trim()) return;
    setGeneratingDraft(true);
    setAiError(null);
    const result = await generateDraftAction(siteId, topic.trim());
    setGeneratingDraft(false);
    if (result.error || !result.draft) {
      setAiError(result.error ?? "生成失败");
      return;
    }
    try {
      editor
        .chain()
        .focus()
        .insertContent(result.draft, { contentType: "markdown" } as never)
        .run();
    } catch {
      const current = editor.getMarkdown();
      const next = `${current}\n\n${result.draft}`;
      editor.commands.setContent(next, { contentType: "markdown" });
      setMarkdown(next);
    }
  }

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("链接地址(留空可取消/移除链接)", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const queued = tasks.some((task) => task.status === "queued");

  useLayoutEffect(() => {
    if (!fill) {
      setPaneHeight(null);
      return;
    }
    const pane = paneRef.current;
    if (!pane) return;

    function measure() {
      const node = paneRef.current;
      if (!node) return;
      const viewport = window.visualViewport?.height ?? window.innerHeight;
      const top = node.getBoundingClientRect().top;
      const main = node.closest("main");
      const pad = main ? Number.parseFloat(getComputedStyle(main).paddingBottom) || 16 : 16;
      const next = Math.max(160, Math.floor(viewport - top - pad));
      setPaneHeight((prev) => (prev === next ? prev : next));
    }

    measure();
    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);
    const parent = pane.parentElement;
    const observer = parent ? new ResizeObserver(measure) : null;
    if (parent && observer) observer.observe(parent);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, [fill, mode, aiError]);

  return (
    <div className={fill ? "flex min-h-0 flex-1 flex-col" : ""}>
      <input type="hidden" name={name} value={markdown} />
      <div
        ref={paneRef}
        className={fill ? "flex min-h-0 flex-col overflow-hidden" : ""}
        style={
          fill && paneHeight != null
            ? { height: paneHeight, maxHeight: paneHeight }
            : undefined
        }
      >
      <div className="flex shrink-0 flex-wrap items-center gap-1 rounded-t border border-neutral-300 bg-neutral-50 p-1.5">
        <ToolbarButton
          active={editor?.isActive("bold")}
          disabled={mode !== "rich"}
          label="加粗"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("italic")}
          disabled={mode !== "rich"}
          label="斜体"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("strike")}
          disabled={mode !== "rich"}
          label="删除线"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <span className="line-through">S</span>
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          active={editor?.isActive("heading", { level: 1 })}
          disabled={mode !== "rich"}
          label="标题 1"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("heading", { level: 2 })}
          disabled={mode !== "rich"}
          label="标题 2"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("heading", { level: 3 })}
          disabled={mode !== "rich"}
          label="标题 3"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          active={editor?.isActive("bulletList")}
          disabled={mode !== "rich"}
          label="无序列表"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          • 列表
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("orderedList")}
          disabled={mode !== "rich"}
          label="有序列表"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          1. 列表
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("blockquote")}
          disabled={mode !== "rich"}
          label="引用"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          ❝ 引用
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("codeBlock")}
          disabled={mode !== "rich"}
          label="代码块"
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          {"</>"}
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          active={editor?.isActive("link")}
          disabled={mode !== "rich"}
          label="插入链接"
          onClick={setLink}
        >
          🔗 链接
        </ToolbarButton>
        <ToolbarButton
          disabled={mode !== "rich"}
          label="插入图片"
          onClick={() => fileInputRef.current?.click()}
        >
          🖼 图片
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          multiple
          onChange={(event) => {
            const files = imageFilesFromList(event.target.files);
            event.target.value = "";
            uploadFilesRef.current(files);
          }}
        />
        <Divider />
        <ToolbarButton
          disabled={mode !== "rich" || generatingDraft}
          label="AI 生成初稿"
          onClick={handleGenerateDraft}
        >
          {generatingDraft ? "生成中…" : "✨ AI 初稿"}
        </ToolbarButton>
        <div className="ml-auto flex items-center gap-1">
          <ToolbarButton
            active={mode === "rich"}
            label="所见即所得"
            onClick={switchToRich}
          >
            可视化
          </ToolbarButton>
          <ToolbarButton
            active={mode === "source"}
            label="Markdown 源码"
            onClick={switchToSource}
          >
            Markdown 源码
          </ToolbarButton>
          {onToggleFill && (
            <ToolbarButton
              active={fill}
              label={fill ? "恢复默认高度" : "铺满下方空白"}
              onClick={onToggleFill}
            >
              {fill ? "收起" : "铺满"}
            </ToolbarButton>
          )}
        </div>
      </div>

      {aiError && (
        <p className="border-x border-neutral-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
          {aiError}{" "}
          {aiError.includes("AI 设置") && (
            <Link href={`/sites/${siteId}/settings#account-ai`} className="underline hover:text-amber-900">
              前往配置 →
            </Link>
          )}
        </p>
      )}

      {mode === "rich" ? (
        <EditorContent editor={editor} className={fill ? "gp-editor-fill" : undefined} />
      ) : (
        <textarea
          rows={fill ? undefined : 20}
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-b border border-t-0 border-neutral-300 bg-white px-4 py-3 font-mono text-sm leading-relaxed shadow-sm focus:border-wp-accent focus:outline-none ${
            fill ? "min-h-0 flex-1 resize-none" : ""
          }`}
        />
      )}
      {queued && (
        <p className="mt-1 shrink-0 text-[11px] text-neutral-400">
          图片目前只在本机预览,点右侧「发布 / 保存」时会和文章一起写入数据仓库,只触发一次构建。
        </p>
      )}
      <ImageUploadTray
        tasks={tasks}
        onDismiss={(id) => setTasks((prev) => prev.filter((task) => task.id !== id))}
      />
      </div>
    </div>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-neutral-300" />;
}

function ToolbarButton({
  children,
  onClick,
  active,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-wp-accent text-white"
          : "text-neutral-600 hover:bg-neutral-200 disabled:opacity-40"
      }`}
    >
      {children}
    </button>
  );
}

export type { Editor };
