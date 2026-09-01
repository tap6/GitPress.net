"use client";

import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { disableScratchNoteAction, saveScratchNoteAction } from "@/lib/actions";
import { useFormErrorText } from "@/components/FormError";
import { SCRATCH_NOTE_MAX_CHARS } from "@/lib/scratchNoteLimits";

export function ScratchNoteWidget({
  siteId,
  initialBody,
}: {
  siteId: string;
  initialBody: string;
}) {
  const t = useTranslations("widgets");
  const tc = useTranslations("common");
  const errorText = useFormErrorText();
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const savedBody = useRef(initialBody);
  const bodyRef = useRef(initialBody);
  bodyRef.current = body;

  useEffect(() => {
    if (body === savedBody.current) return;
    const handle = window.setTimeout(() => {
      void persist(body);
    }, 800);
    return () => window.clearTimeout(handle);
    // persist is stable enough for this debounce
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body]);

  useEffect(() => {
    return () => {
      const latest = bodyRef.current;
      if (latest !== savedBody.current) {
        void saveScratchNoteAction(siteId, latest);
      }
    };
  }, [siteId]);

  async function persist(next: string) {
    setStatus("saving");
    setError(null);
    const result = await saveScratchNoteAction(siteId, next);
    if (result.error) {
      setStatus("error");
      setError(result.error);
      return;
    }
    savedBody.current = next;
    setStatus("saved");
  }

  async function handleClose() {
    if (!window.confirm(t("closeConfirm"))) return;
    setClosing(true);
    if (body !== savedBody.current) {
      await persist(body);
    }
    const result = await disableScratchNoteAction(siteId);
    if (result.error) {
      setClosing(false);
      setStatus("error");
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const remaining = SCRATCH_NOTE_MAX_CHARS - body.length;

  return (
    <section className="mt-5 rounded border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-2.5">
        <h2 className="text-sm font-semibold text-neutral-800">{t("title")}</h2>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-400">
            {status === "saving"
              ? `${tc("saving")}…`
              : status === "saved"
                ? tc("saved")
                : status === "error"
                  ? errorText(error) || t("saveFail")
                  : t("localOnly")}
          </span>
          <button
            type="button"
            onClick={() => void handleClose()}
            disabled={closing}
            aria-label={t("closeAria")}
            className="rounded px-1.5 py-0.5 text-lg leading-none text-neutral-300 transition-colors hover:text-neutral-800 focus-visible:text-wp-accent focus-visible:outline-none disabled:opacity-50"
          >
            ×
          </button>
        </div>
      </div>
      <div className="p-4">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value.slice(0, SCRATCH_NOTE_MAX_CHARS))}
          rows={4}
          placeholder={t("placeholder")}
          className="w-full resize-y rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400 focus:border-wp-accent focus:bg-white focus:outline-none"
        />
        <p className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400">
          <span>{t("remaining", { n: remaining })}</span>
          <Link href={`/sites/${siteId}/settings#widgets`} className="hover:text-wp-accent hover:underline">
            {t("settingsLink")}
          </Link>
        </p>
      </div>
    </section>
  );
}
