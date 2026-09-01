"use client";

import { useMediaBlob } from "@/hooks/useMediaBlob";
import { useTranslations } from "next-intl";
import { mediaKind } from "@/lib/mediaTypes";
import { mediaPreviewUrl } from "@/lib/mediaUrl";

interface Props {
  siteId: string;
  name: string;
  sha: string;
  alt: string;
  onPreview?: () => void;
}

export function MediaThumb({ siteId, name, sha, alt, onPreview }: Props) {
  const t = useTranslations("media");
  const kind = mediaKind(name);
  const previewUrl = mediaPreviewUrl(siteId, name, sha);
  const { src, failed, loading } = useMediaBlob(previewUrl);
  const previewable = kind === "image" || kind === "video";

  if (failed) {
    return (
      <div className="flex aspect-square items-center justify-center bg-neutral-50 text-xs text-neutral-400">
          {t("cannotPreview")}
      </div>
    );
  }

  if (loading || !src) {
    return <div className="aspect-square animate-pulse bg-neutral-100" />;
  }

  const body =
    kind === "video" ? (
      <video
        src={src}
        muted
        playsInline
        preload="metadata"
        className="aspect-square h-full w-full object-cover"
      />
    ) : kind === "image" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="aspect-square w-full object-cover" />
    ) : (
      <div className="flex aspect-square flex-col items-center justify-center gap-1 bg-neutral-50 text-neutral-400">
        <span className="text-2xl">📄</span>
        <span className="text-[10px] uppercase">{name.split(".").pop()}</span>
      </div>
    );

  if (!previewable || !onPreview) {
    return body;
  }

  return (
    <button
      type="button"
      onClick={onPreview}
      className="group relative block w-full cursor-zoom-in text-left"
      aria-label={t("previewName", { name })}
    >
      {body}
      {kind === "video" && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-lg text-white">
            ▶
          </span>
        </span>
      )}
      {kind === "image" && (
        <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
      )}
    </button>
  );
}
