"use client";

import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRef, useState } from "react";
import { uploadEditorImageAction } from "@/lib/actions";

interface Props {
  /** Form field name that receives the serialized Markdown on submit. */
  name: string;
  siteId: string;
  defaultValue?: string;
  placeholder?: string;
}

/**
 * WYSIWYG post editor backed by Tiptap. Content is kept as plain Markdown at
 * all times (via @tiptap/markdown's bidirectional parser/serializer) so the
 * file committed to the data repo stays a normal, portable .md file — this
 * component only changes how the text is authored, not how it's stored.
 */
export function RichTextEditor({ name, siteId, defaultValue = "", placeholder }: Props) {
  const [markdown, setMarkdown] = useState(defaultValue);
  const [mode, setMode] = useState<"rich" | "source">("rich");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Image,
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
    },
    onUpdate: ({ editor: current }) => {
      setMarkdown(current.getMarkdown());
    },
  });

  function switchToSource() {
    if (editor) setMarkdown(editor.getMarkdown());
    setMode("source");
  }

  function switchToRich() {
    editor?.commands.setContent(markdown, { contentType: "markdown" });
    setMode("rich");
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.set("siteId", siteId);
    formData.set("file", file);
    const result = await uploadEditorImageAction(formData);
    setUploading(false);
    if (result.error || !result.url) {
      setUploadError(result.error ?? "上传失败");
      return;
    }
    editor.chain().focus().setImage({ src: result.url }).run();
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
          disabled={mode !== "rich" || uploading}
          label="插入图片"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "上传中…" : "🖼 图片"}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImagePick}
        />
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

      {uploadError && (
        <p className="border-x border-neutral-300 bg-red-50 px-3 py-1.5 text-xs text-red-600">
          {uploadError}
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
