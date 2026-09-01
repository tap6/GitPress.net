"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useMediaBlob } from "@/hooks/useMediaBlob";
import { mediaKind, type MediaKind } from "@/lib/mediaTypes";
import { mediaPreviewUrl } from "@/lib/mediaUrl";

interface Item {
  name: string;
  path: string;
  size: number;
  sha: string;
}

interface Props {
  siteId: string;
  item: Item;
  onClose: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function PreviewBody({ kind, src }: { kind: MediaKind; src: string }) {
  if (kind === "video") {
    return (
      <video
        src={src}
        controls
        autoPlay
        playsInline
        className="max-h-[min(72vh,720px)] max-w-full rounded-lg bg-black shadow-2xl"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="max-h-[min(72vh,720px)] max-w-full rounded-lg object-contain shadow-2xl"
    />
  );
}

export function MediaPreviewModal({ siteId, item, onClose }: Props) {
  const t = useTranslations("media");
  const tc = useTranslations("common");
  const kind = mediaKind(item.name);
  const previewUrl = mediaPreviewUrl(siteId, item.name, item.sha);
  const { src, failed, loading } = useMediaBlob(previewUrl);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("previewName", { name: item.name })}
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-4xl flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4 text-white">
          <div className="min-w-0">
            <p className="truncate font-medium">{item.name}</p>
            <p className="mt-0.5 text-sm text-white/70">
              {formatSize(item.size)} · /{item.path}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
          >
            {tc("close")}
          </button>
        </div>

        <div className="flex min-h-[240px] flex-1 items-center justify-center">
          {loading && (
            <div className="h-48 w-full max-w-lg animate-pulse rounded-lg bg-white/10" />
          )}
          {failed && (
            <p className="rounded-lg bg-white/10 px-4 py-3 text-sm text-white/80">{t("loadFail")}</p>
          )}
          {!loading && !failed && src && <PreviewBody kind={kind} src={src} />}
        </div>

        <p className="mt-4 text-center text-xs text-white/50">
          {t("articleRef")}
          {kind === "video" ? (
            <code className="ml-1 text-white/70">{`<video src="/media/${item.name}" controls></video>`}</code>
          ) : (
            <code className="ml-1 text-white/70">{`![${t("altHint")}](/media/${item.name})`}</code>
          )}
        </p>
      </div>
    </div>
  );
}
