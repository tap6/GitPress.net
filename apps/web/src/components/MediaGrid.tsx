"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { deleteMediaAction } from "@/lib/actions";
import { MediaPreviewModal } from "@/components/MediaPreviewModal";
import { MediaThumb } from "@/components/MediaThumb";
import { ProgressButton } from "@/components/ProgressButton";
import { pruneMediaCache } from "@/lib/mediaBrowserCache";
import { isPreviewableMedia } from "@/lib/mediaTypes";
import { mediaPreviewUrl } from "@/lib/mediaUrl";

interface Item {
  path: string;
  name: string;
  size: number;
  sha: string;
}

interface Props {
  siteId: string;
  items: Item[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaGrid({ siteId, items }: Props) {
  const tc = useTranslations("common");
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const previewItem = items.find((item) => item.path === previewPath) ?? null;
  const keepKey = items.map((item) => item.sha).join(",");

  useEffect(() => {
    const keep = items.map((item) => mediaPreviewUrl(siteId, item.name, item.sha));
    void pruneMediaCache(siteId, keep);
    // keepKey captures identity of the current library; `items` itself is a new array each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, keepKey]);

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {items.map((item) => (
          <div
            key={item.path}
            className="overflow-hidden rounded border border-neutral-200 bg-white shadow-sm"
          >
            <MediaThumb
              siteId={siteId}
              name={item.name}
              sha={item.sha}
              alt={item.name}
              onPreview={
                isPreviewableMedia(item.name) ? () => setPreviewPath(item.path) : undefined
              }
            />
            <div className="p-2.5">
              <p className="truncate text-xs font-medium" title={item.name}>
                {item.name}
              </p>
              <div className="mt-1 flex items-center justify-between text-xs text-neutral-400">
                <span>{formatSize(item.size)}</span>
                <div className="flex items-center gap-2">
                  {isPreviewableMedia(item.name) && (
                    <button
                      type="button"
                      onClick={() => setPreviewPath(item.path)}
                      className="text-wp-accent hover:underline"
                    >
                      {tc("preview")}
                    </button>
                  )}
                  <form action={deleteMediaAction}>
                    <input type="hidden" name="siteId" value={siteId} />
                    <input type="hidden" name="path" value={item.path} />
                    <ProgressButton
                      expectedSeconds={3}
                      pendingLabel={tc("deleting")}
                      buildSiteId={siteId}
                      className="text-red-500 hover:underline"
                    >
                      {tc("delete")}
                    </ProgressButton>
                  </form>
                </div>
              </div>
              <p className="mt-1 select-all break-all text-[10px] text-neutral-400">/{item.path}</p>
            </div>
          </div>
        ))}
      </div>

      {previewItem && (
        <MediaPreviewModal
          siteId={siteId}
          item={previewItem}
          onClose={() => setPreviewPath(null)}
        />
      )}
    </>
  );
}
