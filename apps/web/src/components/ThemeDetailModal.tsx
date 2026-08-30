"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { removeLibraryThemeAction, type ImportThemeState } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import { ThemeBadgeMark } from "@/components/ThemeBadgeMark";
import { ThemeEnableForm } from "@/components/ThemeCard";
import { ThemePreviewImage } from "@/components/ThemePreviewImage";
import type { ThemeShelfItem } from "@/lib/themeShelf";

export function ThemeDetailModal({
  siteId,
  item,
  onClose,
}: {
  siteId: string;
  item: ThemeShelfItem;
  onClose: () => void;
}) {
  const router = useRouter();
  const [removeState, removeAction] = useActionState<ImportThemeState, FormData>(
    removeLibraryThemeAction,
    {},
  );

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

  useEffect(() => {
    if (removeState.saved) {
      router.refresh();
      onClose();
    }
  }, [removeState.saved, onClose, router]);

  const rows: Array<[string, string | null | undefined]> = [
    ["作者", item.author],
    ["版本", item.version],
    ["协议", item.license],
    ["标识", item.name],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative">
          <ThemePreviewImage src={item.previewSrc} alt={`${item.displayName} 预览`} className="h-56 sm:h-72" />
          <ThemeBadgeMark badge={item.badge} />
        </div>
        <div className="space-y-3 p-5 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="theme-detail-title" className="text-lg font-semibold text-neutral-900">
                {item.displayName}
              </h2>
              {item.active ? (
                <p className="mt-1 text-xs font-medium text-wp-accent">当前主题</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
            >
              关闭
            </button>
          </div>
          {item.description ? <p className="text-neutral-600">{item.description}</p> : null}
          <dl className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 text-xs text-neutral-500">
            {rows.map(([label, value]) =>
              value ? (
                <div key={label} className="contents">
                  <dt>{label}</dt>
                  <dd className="text-neutral-700">{value}</dd>
                </div>
              ) : null,
            )}
            {item.homepage ? (
              <div className="contents">
                <dt>主页</dt>
                <dd>
                  <a href={item.homepage} target="_blank" rel="noreferrer" className="text-wp-accent hover:underline">
                    {item.homepage}
                  </a>
                </dd>
              </div>
            ) : null}
            {item.githubUrl ? (
              <div className="contents">
                <dt>仓库</dt>
                <dd>
                  <a href={item.githubUrl} target="_blank" rel="noreferrer" className="text-wp-accent hover:underline">
                    GitHub ↗
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
          <p className="text-xs text-neutral-400">
            启用其他主题时会按该主题的默认选项重建,上一套主题的强调色等配置不会跟过来。
          </p>
          {removeState.error ? (
            <p className="rounded bg-red-50 p-2 text-xs text-red-600">{removeState.error}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <ThemeEnableForm siteId={siteId} item={item} />
            {item.kind === "library" && !item.active ? (
              <form action={removeAction}>
                <input type="hidden" name="siteId" value={siteId} />
                <input type="hidden" name="libraryId" value={item.id} />
                <ProgressButton
                  expectedSeconds={3}
                  pendingLabel="移除中"
                  className="text-xs text-red-600 hover:underline"
                >
                  从列表移除
                </ProgressButton>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
