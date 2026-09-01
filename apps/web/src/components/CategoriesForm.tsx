"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { ProgressButton } from "@/components/ProgressButton";
import { FormError } from "@/components/FormError";
import { saveCategoriesAction, type SaveCategoriesState } from "@/lib/actions";
import { isCategoryInNav, persistSiteCategory, type SiteCategory } from "@/lib/categories";

interface Row extends SiteCategory {
  /** Client-only key so React can track rows across reorders/deletes. */
  key: string;
}

function localSlugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `category-${Date.now()}`;
}

let keySeq = 0;
function nextKey(): string {
  keySeq += 1;
  return `row-${Date.now()}-${keySeq}`;
}

interface Props {
  siteId: string;
  initial: SiteCategory[];
}

export function CategoriesForm({ siteId, initial }: Props) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((c) => ({ ...c, inNav: isCategoryInNav(c), key: nextKey() })),
  );
  const [state, formAction] = useActionState<SaveCategoriesState, FormData>(
    saveCategoriesAction,
    {},
  );

  function updateLabel(key: string, label: string) {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, label, slug: row.slug || localSlugify(label) } : row)),
    );
  }

  function updateSlug(key: string, slug: string) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, slug } : row)));
  }

  function toggleInNav(key: string) {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, inNav: !isCategoryInNav(row) } : row)),
    );
  }

  function remove(key: string) {
    setRows((prev) => prev.filter((row) => row.key !== key));
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

  function addRow() {
    setRows((prev) => [...prev, { key: nextKey(), slug: "", label: "", inNav: true }]);
  }

  const categoriesJson = JSON.stringify(
    rows.map((row) =>
      persistSiteCategory({
        slug: row.slug || localSlugify(row.label),
        label: row.label,
        inNav: isCategoryInNav(row),
      }),
    ),
  );

  return (
    <form action={formAction} className="text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="categoriesJson" value={categoriesJson} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
        <p className="text-xs text-neutral-400">{t("catOrderHint")}</p>
        <button
          type="button"
          onClick={addRow}
          className="rounded border border-dashed border-neutral-300 px-3 py-1.5 text-neutral-500 hover:border-wp-accent hover:text-wp-accent"
        >
          {t("addCat")}
        </button>
      </div>

      <div className="space-y-3 p-4">
        {rows.length === 0 && (
          <p className="text-neutral-400">{t("noCats")}</p>
        )}

        {rows.length > 0 && (
          <div className="hidden items-center gap-2 text-xs text-neutral-400 sm:flex">
            <span className="w-6 shrink-0" />
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_10rem_7rem] items-center gap-2">
              <span>{t("catName")}</span>
              <span>slug</span>
              <span className="text-center">{t("catNav")}</span>
            </div>
            <span className="w-8 shrink-0" />
          </div>
        )}

        <div className="space-y-2">
          {rows.map((row, index) => {
            const inNav = isCategoryInNav(row);
            return (
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
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_7rem] sm:items-center">
                  <input
                    value={row.label}
                    onChange={(e) => updateLabel(row.key, e.target.value)}
                    placeholder={t("catNamePlaceholder")}
                    className="min-w-0 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
                  />
                  <input
                    value={row.slug}
                    onChange={(e) => updateSlug(row.key, e.target.value)}
                    placeholder={t("catSlugPlaceholder")}
                    className="w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs text-neutral-500 focus:border-wp-accent focus:outline-none"
                  />
                  <div
                    className="flex items-center justify-between gap-2 sm:justify-center"
                    title={inNav ? t("catNavOn") : t("catNavOff")}
                  >
                    <span className="text-[11px] text-neutral-400 sm:hidden">{t("catNav")}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inNav}
                      aria-label={t("catNavAria", { label: row.label || t("thisCategory") })}
                      onClick={() => toggleInNav(row.key)}
                      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wp-accent focus-visible:ring-offset-1 ${
                        inNav ? "bg-wp-accent" : "bg-neutral-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          inNav ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className={`text-[11px] ${inNav ? "text-neutral-500" : "text-neutral-400"}`}>
                      {inNav ? t("shown") : t("hidden")}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(row.key)}
                  className="w-8 shrink-0 px-2 pt-2 text-neutral-400 hover:text-red-600 sm:pt-0"
                  aria-label={tc("delete")}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <FormError error={state.error} className="mx-4 mb-3 rounded bg-red-50 p-3 text-red-600" />
      {state.saved && (
        <p className="mx-4 mb-3 rounded bg-emerald-50 p-3 text-emerald-700">{t("savedNav")}</p>
      )}

      <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
        <ProgressButton
          expectedSeconds={4}
          pendingLabel={tc("saving")}
          buildSiteId={siteId}
          className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
        >
          {t("saveCats")}
        </ProgressButton>
      </div>
    </form>
  );
}
