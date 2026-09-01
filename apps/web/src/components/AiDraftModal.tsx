"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { generateDraftAction, hasAiConfigAction } from "@/lib/actions";
import { isNeedAiConfig, useFormErrorText } from "@/components/FormError";
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
  const t = useTranslations("editor");
  const tc = useTranslations("common");
  const errorText = useFormErrorText();
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
      setError("needPrompt");
      return;
    }
    setGenerating(true);
    setError(null);
    const result = await generateDraftAction(siteId, topic.trim(), { tone, length });
    setGenerating(false);
    if (result.error || !result.draft) {
      setError(result.error ?? "generateFailed");
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
              {t("aiTitle")}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              {t("aiLead")}{" "}
              <Link href="/help/ai-writing" className="text-wp-accent hover:underline" target="_blank">
                {t("aiHow")}
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
          >
            {tc("cancel")}
          </button>
        </div>

        <div className="space-y-4 p-5 text-sm">
          {configured === false && (
            <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
              {t("aiNotConfigured")}{" "}
              <Link href={settingsHref} className="font-medium underline hover:text-amber-950">
                {t("aiGoSettings")}
              </Link>
            </p>
          )}

          <label className="block">
            <span className="text-neutral-500">{t("aiTopic")}</span>
            <textarea
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              rows={4}
              placeholder={t("aiTopicPlaceholder")}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-neutral-500">{t("aiTone")}</span>
              <select
                value={tone}
                onChange={(event) => setTone(event.target.value as DraftTone)}
                className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
              >
                <option value="default">{t("toneDefault")}</option>
                <option value="formal">{t("toneFormal")}</option>
                <option value="casual">{t("toneCasual")}</option>
              </select>
            </label>
            <label className="block">
              <span className="text-neutral-500">{t("aiLength")}</span>
              <select
                value={length}
                onChange={(event) => setLength(event.target.value as DraftLength)}
                className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
              >
                <option value="short">{t("lengthShort")}</option>
                <option value="medium">{t("lengthMedium")}</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => void generate()}
            disabled={generating || configured === false}
            className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark disabled:opacity-50"
          >
            {generating ? t("generating") : draft ? t("regenerate") : t("generateDraft")}
          </button>

          {error && (
            <p className="text-xs text-amber-700">
              {errorText(error)}{" "}
              {isNeedAiConfig(error) && (
                <Link href={settingsHref} className="underline hover:text-amber-900">
                  {t("goConfigure")}
                </Link>
              )}
            </p>
          )}

          {draft && (
            <div>
              <p className="text-neutral-500">{tc("preview")}</p>
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
                  {t("insertAtCursor")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onReplace(draft);
                    onClose();
                  }}
                  className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
                >
                  {t("replaceAll")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
