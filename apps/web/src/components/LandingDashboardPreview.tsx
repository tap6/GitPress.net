"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";

export function LandingDashboardPreview({ src }: { src: string }) {
  const t = useTranslations("landing");
  const titleId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <figure className="mx-auto mt-12 max-w-3xl">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full cursor-zoom-in rounded-xl border border-neutral-200 bg-white text-left shadow-sm outline-none ring-gp-brand focus-visible:ring-2"
          aria-label={t("previewEnlarge")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={t("previewAlt")}
            width={2776}
            height={2026}
            className="w-full rounded-xl"
          />
        </button>
        <figcaption className="mt-2 text-center text-xs text-neutral-400">{t("previewHint")}</figcaption>
      </figure>
      {open ? (
        <div
          className="fixed inset-0 z-[80] flex cursor-zoom-out items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-label={t("previewShrink")}
          onClick={() => setOpen(false)}
        >
          <p id={titleId} className="sr-only">
            {t("previewAlt")}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            width={2776}
            height={2026}
            className="pointer-events-none max-h-[92vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
        </div>
      ) : null}
    </>
  );
}
