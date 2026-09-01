"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { ProgressButton } from "@/components/ProgressButton";
import { FormError } from "@/components/FormError";
import { saveFooterAction, type SaveFooterState } from "@/lib/actions";
import type { FooterItem } from "@/lib/footer";
import { defaultFooterItems, defaultCopyrightPlaceholder } from "@/lib/footer";
import type { SitePage } from "@/lib/content";
import { defaultGitpressLabel, defaultThemeCreditLabel } from "@/lib/locale";

type Row = FooterItem & { key: string };

let keySeq = 0;
function nextKey(): string {
  keySeq += 1;
  return `footer-${Date.now()}-${keySeq}`;
}

function toRow(item: FooterItem): Row {
  return { ...item, key: nextKey() };
}

function typeBadge(type: FooterItem["type"], t: (key: string) => string): string {
  switch (type) {
    case "copyright":
      return t("footerTypeCopyright");
    case "gitpress":
      return "GitPress";
    case "theme":
      return t("footerTypeTheme");
    case "rss":
      return "RSS";
    case "page":
      return t("footerTypePage");
    case "link":
      return t("footerTypeLink");
    case "text":
      return t("footerTypeText");
  }
}

function placeholder(
  item: FooterItem,
  pages: SitePage[],
  language: string,
  siteTitle: string,
  themeDisplayName: string,
  textPlaceholder: string,
): string {
  switch (item.type) {
    case "copyright":
      return defaultCopyrightPlaceholder(siteTitle);
    case "gitpress":
      return defaultGitpressLabel(language);
    case "theme":
      return defaultThemeCreditLabel(language, themeDisplayName);
    case "rss":
      return "RSS";
    case "page":
      return pages.find((p) => p.slug === item.slug)?.title ?? item.slug;
    case "link":
      return item.label;
    case "text":
      return textPlaceholder;
  }
}

interface Props {
  siteId: string;
  siteTitle: string;
  themeDisplayName: string;
  /** null = never saved; theme uses the default four slots. */
  initial: FooterItem[] | null;
  pages: SitePage[];
  language: string;
}

export function FooterForm({
  siteId,
  siteTitle,
  themeDisplayName,
  initial,
  pages,
  language,
}: Props) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [rows, setRows] = useState<Row[]>(() => (initial ?? defaultFooterItems()).map(toRow));
  const [pendingGitpressKey, setPendingGitpressKey] = useState<string | null>(null);
  const [state, formAction] = useActionState<SaveFooterState, FormData>(saveFooterAction, {});

  const hasCopyright = rows.some((r) => r.type === "copyright");
  const hasGitpress = rows.some((r) => r.type === "gitpress");
  const hasTheme = rows.some((r) => r.type === "theme");
  const hasRss = rows.some((r) => r.type === "rss");
  const usedPageSlugs = new Set(rows.filter((r) => r.type === "page").map((r) => r.slug));
  const availablePages = pages.filter((p) => !usedPageSlugs.has(p.slug));

  function addItem(item: FooterItem) {
    setRows((prev) => [...prev, toRow(item)]);
  }

  function updateLabel(key: string, label: string) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, label } : row)));
  }

  function updateLink(key: string, patch: Partial<{ url: string; label: string }>) {
    setRows((prev) =>
      prev.map((row) => (row.key === key && row.type === "link" ? { ...row, ...patch } : row)),
    );
  }

  function remove(key: string) {
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  function requestRemove(row: Row) {
    if (row.type === "gitpress") {
      setPendingGitpressKey(row.key);
      return;
    }
    remove(row.key);
  }

  function move(key: string, delta: number) {
    setRows((prev) => {
      const index = prev.findIndex((row) => row.key === key);
      const target = index + delta;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const footerJson = JSON.stringify(
    rows.map(({ key, ...item }) => {
      void key;
      return item;
    }),
  );

  return (
    <form action={formAction} className="text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="footerJson" value={footerJson} />

      {pendingGitpressKey && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-labelledby="hide-gitpress-title"
            className="max-w-md rounded-lg bg-white p-5 shadow-xl"
          >
            <h3 id="hide-gitpress-title" className="text-base font-semibold text-neutral-900">
              {t("hideGitpressTitle")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t("hideGitpressBody")}</p>
            <p className="mt-2 text-sm text-neutral-500">{t("hideGitpressOk")}</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingGitpressKey(null)}
                className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
              >
                {t("keep")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingGitpressKey) remove(pendingGitpressKey);
                  setPendingGitpressKey(null);
                }}
                className="rounded border border-neutral-300 px-4 py-2 text-neutral-600 hover:bg-neutral-50"
              >
                {t("hideAnyway")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 px-4 py-3">
        <p className="mr-auto text-xs text-neutral-400">{t("footerOrderHint")}</p>
        {!hasCopyright && (
          <button
            type="button"
            onClick={() => addItem({ type: "copyright" })}
            className="rounded border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 hover:border-wp-accent hover:text-wp-accent"
          >
            {t("addCopyright")}
          </button>
        )}
        {!hasGitpress && (
          <button
            type="button"
            onClick={() => addItem({ type: "gitpress" })}
            className="rounded border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 hover:border-wp-accent hover:text-wp-accent"
          >
            {t("addGitpress")}
          </button>
        )}
        {!hasTheme && (
          <button
            type="button"
            onClick={() => addItem({ type: "theme" })}
            className="rounded border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 hover:border-wp-accent hover:text-wp-accent"
          >
            {t("addThemeCredit")}
          </button>
        )}
        {!hasRss && (
          <button
            type="button"
            onClick={() => addItem({ type: "rss" })}
            className="rounded border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 hover:border-wp-accent hover:text-wp-accent"
          >
            {t("addRss")}
          </button>
        )}
        {availablePages.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) addItem({ type: "page", slug: e.target.value });
            }}
            className="rounded border border-dashed border-neutral-300 px-2 py-1 text-xs text-neutral-500"
          >
            <option value="">{t("addPage")}</option>
            {availablePages.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => addItem({ type: "link", url: "", label: "" })}
          className="rounded border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 hover:border-wp-accent hover:text-wp-accent"
        >
          {t("addCustomLink")}
        </button>
        <button
          type="button"
          onClick={() => addItem({ type: "text", label: "" })}
          className="rounded border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 hover:border-wp-accent hover:text-wp-accent"
        >
          {t("addText")}
        </button>
      </div>

      <div className="space-y-2 p-4">
        {rows.length === 0 && (
          <p className="text-neutral-400">{t("footerEmpty")}</p>
        )}

        {rows.map((row, index) => (
          <div key={row.key} className="flex items-start gap-2 sm:items-center">
            <div className="flex w-6 shrink-0 flex-row sm:flex-col">
              <button
                type="button"
                onClick={() => move(row.key, -1)}
                disabled={index === 0}
                className="px-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-20"
                aria-label={tc("moveUp")}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(row.key, 1)}
                disabled={index === rows.length - 1}
                className="px-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-20"
                aria-label={tc("moveDown")}
              >
                ▼
              </button>
            </div>

            <span className="w-[4.5rem] shrink-0 rounded bg-neutral-100 px-1.5 py-1 text-center text-[11px] text-neutral-500">
              {typeBadge(row.type, t)}
            </span>

            {row.type === "link" ? (
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={row.label}
                  onChange={(e) => updateLink(row.key, { label: e.target.value })}
                  placeholder={t("linkName")}
                  className="min-w-0 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
                />
                <input
                  value={row.url}
                  onChange={(e) => updateLink(row.key, { url: e.target.value })}
                  placeholder="https://..."
                  className="min-w-0 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
                />
              </div>
            ) : (
              <input
                value={row.label ?? ""}
                onChange={(e) => updateLabel(row.key, e.target.value)}
                placeholder={placeholder(row, pages, language, siteTitle, themeDisplayName, t("footerTextPlaceholder"))}
                className="min-w-0 flex-1 rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
              />
            )}

            <button
              type="button"
              onClick={() => requestRemove(row)}
              className="w-8 shrink-0 px-2 pt-2 text-neutral-400 hover:text-red-600 sm:pt-0"
              aria-label={tc("delete")}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <FormError error={state.error} className="mx-4 mb-4 rounded bg-red-50 p-3 text-red-600" />
      {state.saved && (
        <p className="mx-4 mb-4 rounded bg-emerald-50 p-3 text-emerald-700">{tc("savedRebuild")}</p>
      )}
      <div className="border-t border-neutral-100 p-4">
        <ProgressButton
          expectedSeconds={5}
          pendingLabel={tc("saving")}
          buildSiteId={siteId}
          className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
        >
          {tc("saveRebuild")}
        </ProgressButton>
      </div>
    </form>
  );
}
