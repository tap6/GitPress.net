"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProgressButton } from "@/components/ProgressButton";
import { uploadMediaAction } from "@/lib/actions";
import { convertJpegPngToWebp } from "@/lib/convertUploadWebp";
import { MEDIA_LIBRARY_ACCEPT } from "@/lib/mediaTypes";

export function MediaUploadForm({
  siteId,
  convertUploadsToWebp,
}: {
  siteId: string;
  convertUploadsToWebp: boolean;
}) {
  const t = useTranslations("media");
  const tc = useTranslations("common");
  const submittingRef = useRef<"idle" | "convert" | "submit">("idle");
  const [converting, setConverting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!convertUploadsToWebp) return;
    if (submittingRef.current === "submit") return;
    if (submittingRef.current === "convert") {
      event.preventDefault();
      return;
    }
    const form = event.currentTarget;
    const input = form.querySelector('input[name="file"]') as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    event.preventDefault();
    submittingRef.current = "convert";
    setConverting(true);
    try {
      const converted = await convertJpegPngToWebp(file);
      if (converted !== file && input) {
        try {
          const transfer = new DataTransfer();
          transfer.items.add(converted);
          input.files = transfer.files;
        } catch {
          /* keep the original file in the input */
        }
      }
      submittingRef.current = "submit";
      form.requestSubmit();
    } finally {
      submittingRef.current = "idle";
      setConverting(false);
    }
  }

  return (
    <form
      action={uploadMediaAction}
      onSubmit={onSubmit}
      className="mt-5 flex flex-wrap items-center gap-3 rounded border border-dashed border-neutral-300 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="siteId" value={siteId} />
      <input type="file" name="file" accept={MEDIA_LIBRARY_ACCEPT} required className="text-sm" />
      <ProgressButton
        expectedSeconds={8}
        pendingLabel={tc("uploading")}
        buildSiteId={siteId}
        disabled={converting}
        className="rounded bg-wp-accent px-4 py-2 text-sm font-medium text-white hover:bg-wp-accent-dark disabled:opacity-60"
      >
        {converting ? t("converting") : t("upload")}
      </ProgressButton>
      <span className="text-xs text-neutral-400">{t("uploadHint")}</span>
      <p className="w-full text-xs text-neutral-400">
        {convertUploadsToWebp ? t("uploadConvertOn") : t("uploadConvertOff")}{" "}
        <Link href={`/sites/${siteId}/settings#media`} className="text-wp-accent hover:underline">
          {t("uploadConvertLink")}
        </Link>
      </p>
    </form>
  );
}
