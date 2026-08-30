"use client";

import {
  applyCatalogThemeAction,
  enableLibraryThemeAction,
  switchThemeAction,
} from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import { ThemeBadgeMark } from "@/components/ThemeBadgeMark";
import { ThemePreviewImage } from "@/components/ThemePreviewImage";
import type { ThemeShelfItem } from "@/lib/themeShelf";

export function ThemeEnableForm({
  siteId,
  item,
  className,
}: {
  siteId: string;
  item: ThemeShelfItem;
  className?: string;
}) {
  if (item.active) {
    return <p className={`text-xs font-medium text-wp-accent ${className ?? ""}`}>✓ 当前主题</p>;
  }

  const action =
    item.kind === "builtin"
      ? switchThemeAction
      : item.kind === "catalog"
        ? applyCatalogThemeAction
        : enableLibraryThemeAction;
  const fieldName = item.kind === "builtin" ? "theme" : item.kind === "catalog" ? "listingId" : "libraryId";

  return (
    <form action={action} className={className} onClick={(event) => event.stopPropagation()}>
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name={fieldName} value={item.id} />
      <ProgressButton
        expectedSeconds={item.kind === "builtin" ? 5 : 6}
        pendingLabel="启用中"
        buildSiteId={siteId}
        className="rounded border border-wp-accent px-3 py-1 text-xs text-wp-accent hover:bg-wp-accent hover:text-white"
      >
        启用
      </ProgressButton>
    </form>
  );
}

export function ThemeCard({
  siteId,
  item,
  onOpen,
}: {
  siteId: string;
  item: ThemeShelfItem;
  onOpen: () => void;
}) {
  return (
    <article
      className={`overflow-hidden rounded-lg border-2 bg-white shadow-sm ${
        item.active ? "border-wp-accent" : "border-neutral-200"
      }`}
    >
      <button type="button" className="block w-full text-left" onClick={onOpen}>
        <div className="relative">
          <ThemePreviewImage src={item.previewSrc} alt={`${item.displayName} 预览`} />
          <ThemeBadgeMark badge={item.badge} />
        </div>
        <div className="border-t border-neutral-100 p-4 pb-2">
          <p className="text-sm font-semibold">{item.displayName}</p>
          <p className="mt-0.5 text-xs text-neutral-400">{item.author || "未知作者"}</p>
        </div>
      </button>
      <div className="px-4 pb-4">
        <ThemeEnableForm siteId={siteId} item={item} className="mt-1" />
      </div>
    </article>
  );
}
