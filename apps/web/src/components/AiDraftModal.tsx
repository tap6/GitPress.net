"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { generateDraftAction, hasAiConfigAction } from "@/lib/actions";
import type { DraftLength, DraftTone } from "@/lib/ai";

export function AiDraftModal({
  siteId,
  open,
  onClose,
  onInsert,
  onReplace,
}: {
  siteId: string;
  open: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
  onReplace: (markdown: string) => void;
}) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<DraftTone>("default");
  const [length, setLength] = useState<DraftLength>("medium");
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

  const settingsHref = `/sites/${siteId}/settings#account-ai`;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void hasAiConfigAction(siteId).then((ok) => {
      if (!cancelled) setConfigured(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [open, siteId]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  async function generate() {
    if (!topic.trim()) {
      setError("请先填写主题或要点。");
      return;
    }
    setGenerating(true);
    setError(null);
    const result = await generateDraftAction(siteId, topic.trim(), { tone, length });
    setGenerating(false);
    if (result.error || !result.draft) {
      setError(result.error ?? "生成失败");
      return;
    }
    setDraft(result.draft);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-draft-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 id="ai-draft-title" className="text-lg font-semibold text-neutral-900">
              AI 初稿
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              先看预览再插入。不会自动保存到仓库。{" "}
              <Link href="/help/ai-writing" className="text-wp-accent hover:underline" target="_blank">
                怎么用
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
          >
            取消
          </button>
        </div>

        <div className="space-y-4 p-5 text-sm">
          {configured === false && (
            <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
              还没有配置 AI。{" "}
              <Link href={settingsHref} className="font-medium underline hover:text-amber-950">
                前往设置 →
              </Link>
            </p>
          )}

          <label className="block">
            <span className="text-neutral-500">主题或要点</span>
            <textarea
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              rows={4}
              placeholder="例如：周末去了海边，想写一篇带一点天气和食物细节的随笔"
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-neutral-500">语气</span>
              <select
                value={tone}
                onChange={(event) => setTone(event.target.value as DraftTone)}
                className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
              >
                <option value="default">自然</option>
                <option value="formal">正式</option>
                <option value="casual">轻松</option>
              </select>
            </label>
            <label className="block">
              <span className="text-neutral-500">篇幅</span>
              <select
                value={length}
                onChange={(event) => setLength(event.target.value as DraftLength)}
                className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
              >
                <option value="short">短</option>
                <option value="medium">中</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => void generate()}
            disabled={generating || configured === false}
            className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark disabled:opacity-50"
          >
            {generating ? "生成中…" : draft ? "再生成" : "生成初稿"}
          </button>

          {error && (
            <p className="text-xs text-amber-700">
              {error}{" "}
              {error.includes("AI 设置") && (
                <Link href={settingsHref} className="underline hover:text-amber-900">
                  前往配置 →
                </Link>
              )}
            </p>
          )}

          {draft && (
            <div>
              <p className="text-neutral-500">预览</p>
              <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100">
                {draft}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onInsert(draft);
                    onClose();
                  }}
                  className="rounded bg-wp-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-wp-accent-dark"
                >
                  插入光标处
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onReplace(draft);
                    onClose();
                  }}
                  className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
                >
                  替换全文
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
