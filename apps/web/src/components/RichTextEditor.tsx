"use client";

import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateDraftAction, uploadEditorImageAction } from "@/lib/actions";
import { ImageUploadTray, type ImageUploadTask } from "@/components/ImageUploadTray";
import { uniqueMediaFileName } from "@/lib/mediaName";

interface Props {
  /** Form field name that receives the serialized Markdown on submit. */
  name: string;
  siteId: string;
  defaultValue?: string;
  placeholder?: string;
  /** Fires whenever the serialized Markdown changes — lets the parent (e.g. for "AI 生成摘要") read the latest body text. */
  onChange?: (markdown: string) => void;
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
            img.src = `/api/sites/${siteId}/media/${fileName.split("/").map(encodeURIComponent).join("/")}`;
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
 * preview while uploading and a same-origin proxy afterwards.
 */
export function RichTextEditor({ name, siteId, defaultValue = "", placeholder, onChange }: Props) {
  const [markdown, setMarkdownState] = useState(defaultValue);
  const [mode, setMode] = useState<"rich" | "source">("rich");
  const [tasks, setTasks] = useState<ImageUploadTask[]>([]);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const previews = useRef(new Map<string, string>());
  const uploadFilesRef = useRef<(files: File[]) => void>(() => {});

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
          "gp-editor min-h-[420px] w-full max-w-none rounded-b border border-t-0 border-neutral-300 bg-white px-4 py-3 text-sm leading-relaxed focus:outline-none",
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

  async function uploadImages(files: File[]) {
    const current = editorRef.current;
    if (!current || files.length === 0) return;

    for (const file of files) {
      if (file.size > 8 * 1024 * 1024) {
        const id = `${file.name}-too-big-${Date.now()}`;
        setTasks((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            preview: "",
            status: "error",
            error: "单个文件最大 8MB",
          },
        ]);
        continue;
      }

      const fileName = uniqueMediaFileName(file.name);
      const src = `/media/${fileName}`;
      const blobUrl = URL.createObjectURL(file);
      previews.current.set(src, blobUrl);
      const taskId = fileName;
      setTasks((prev) => [
        ...prev,
        { id: taskId, name: file.name, preview: blobUrl, status: "uploading" },
      ]);
      current
        .chain()
        .focus()
        .setImage({ src, alt: file.name.replace(/\.[^.]+$/, "") })
        .run();

      const named = new File([file], fileName, { type: file.type });
      const formData = new FormData();
      formData.set("siteId", siteId);
      formData.set("file", named);
      const result = await uploadEditorImageAction(formData);
      if (result.error || !result.url) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, status: "error", error: result.error ?? "上传失败" }
              : task,
          ),
        );
        continue;
      }
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: "done" } : task)),
      );
      window.setTimeout(() => {
        setTasks((prev) => prev.filter((task) => task.id !== taskId || task.status !== "done"));
      }, 3500);
    }
  }

  uploadFilesRef.current = (files) => {
    void uploadImages(files);
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

  const uploading = tasks.some((task) => task.status === "uploading");

  return (
    <div>
      <input type="hidden" name={name} value={markdown} />
      <div className="flex flex-wrap items-center gap-1 rounded-t border border-neutral-300 bg-neutral-50 p-1.5">
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
        <EditorContent editor={editor} />
      ) : (
        <textarea
          rows={20}
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-b border border-t-0 border-neutral-300 bg-white px-4 py-3 font-mono text-sm leading-relaxed shadow-sm focus:border-wp-accent focus:outline-none"
        />
      )}
      {uploading && (
        <p className="mt-1 text-[11px] text-neutral-400">图片正在写入你的数据仓库,编辑框里已是本地预览。</p>
      )}
      <ImageUploadTray
        tasks={tasks}
        onDismiss={(id) => setTasks((prev) => prev.filter((task) => task.id !== id))}
      />
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
