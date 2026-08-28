"use client";

import { useActionState, useState } from "react";
import { ProgressButton } from "@/components/ProgressButton";
import { saveMenuAction, type SaveMenuState } from "@/lib/actions";
import type { NavItem } from "@/lib/nav";
import type { SiteCategory } from "@/lib/categories";
import type { SitePage } from "@/lib/content";
import { defaultHomeLabel } from "@/lib/locale";

type Row = NavItem & {
  /** Client-only key so React can track rows across reorders/deletes. */
  key: string;
};

let keySeq = 0;
function nextKey(): string {
  keySeq += 1;
  return `nav-${Date.now()}-${keySeq}`;
}

function toRow(item: NavItem): Row {
  return { ...item, key: nextKey() };
}

/** Implicit nav (Home + inNav categories + every page). RSS belongs in the
 * footer by default, so it is not prefilled here — owners can still add it. */
function legacyDefault(categories: SiteCategory[], pages: SitePage[]): NavItem[] {
  return [
    { type: "home" },
    ...categories.filter((c) => c.inNav !== false).map((c): NavItem => ({ type: "category", slug: c.slug })),
    ...pages.map((p): NavItem => ({ type: "page", slug: p.slug })),
  ];
}

function defaultLabel(
  item: NavItem,
  categories: SiteCategory[],
  pages: SitePage[],
  language: string,
): string {
  switch (item.type) {
    case "home":
      return defaultHomeLabel(language);
    case "rss":
      return "RSS";
    case "category":
      return categories.find((c) => c.slug === item.slug)?.label ?? item.slug;
    case "page":
      return pages.find((p) => p.slug === item.slug)?.title ?? item.slug;
    case "link":
      return item.label;
  }
}

function typeBadge(type: NavItem["type"]): string {
  switch (type) {
    case "home":
      return "首页";
    case "rss":
      return "RSS";
    case "category":
      return "分类";
    case "page":
      return "页面";
    case "link":
      return "外链";
  }
}

interface Props {
  siteId: string;
  /** null = site has not configured an explicit menu yet (theme uses its legacy default). */
  initial: NavItem[] | null;
  categories: SiteCategory[];
  pages: SitePage[];
  language: string;
}

export function MenuForm({ siteId, initial, categories, pages, language }: Props) {
  const [rows, setRows] = useState<Row[]>(() =>
    (initial ?? legacyDefault(categories, pages)).map(toRow),
  );
  const [state, formAction] = useActionState<SaveMenuState, FormData>(saveMenuAction, {});

  const hasHome = rows.some((r) => r.type === "home");
  const hasRss = rows.some((r) => r.type === "rss");
  const usedCategorySlugs = new Set(rows.filter((r) => r.type === "category").map((r) => r.slug));
  const usedPageSlugs = new Set(rows.filter((r) => r.type === "page").map((r) => r.slug));
  const availableCategories = categories.filter((c) => !usedCategorySlugs.has(c.slug));
  const availablePages = pages.filter((p) => !usedPageSlugs.has(p.slug));

  function addItem(item: NavItem) {
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

  const navJson = JSON.stringify(
    rows.map(({ key, ...item }) => {
      void key;
      return item;
    }),
  );

  return (
    <form action={formAction} className="text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="navJson" value={navJson} />

      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 px-4 py-3">
        <p className="mr-auto text-xs text-neutral-400">
          列表顺序就是顶栏顺序,移除的项不会出现在导航中(分类归档页、独立页面本身不受影响)。
        </p>
        {!hasHome && (
          <button
            type="button"
            onClick={() => addItem({ type: "home" })}
            className="rounded border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 hover:border-wp-accent hover:text-wp-accent"
          >
            + 首页
          </button>
        )}
        {!hasRss && (
          <button
            type="button"
            onClick={() => addItem({ type: "rss" })}
            className="rounded border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 hover:border-wp-accent hover:text-wp-accent"
          >
            + RSS
          </button>
        )}
        {availableCategories.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) addItem({ type: "category", slug: e.target.value });
            }}
            className="rounded border border-dashed border-neutral-300 px-2 py-1 text-xs text-neutral-500"
          >
            <option value="">+ 添加分类</option>
            {availableCategories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        )}
        {availablePages.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) addItem({ type: "page", slug: e.target.value });
            }}
            className="rounded border border-dashed border-neutral-300 px-2 py-1 text-xs text-neutral-500"
          >
            <option value="">+ 添加页面</option>
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
          + 自定义链接
        </button>
      </div>

      <div className="space-y-2 p-4">
        {rows.length === 0 && (
          <p className="text-neutral-400">菜单为空,站点将不显示任何顶部导航链接。</p>
        )}

        {rows.map((row, index) => (
          <div key={row.key} className="flex items-start gap-2 sm:items-center">
            <div className="flex w-6 shrink-0 flex-row sm:flex-col">
              <button
                type="button"
                onClick={() => move(row.key, -1)}
                disabled={index === 0}
                className="px-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-20"
                aria-label="上移"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(row.key, 1)}
                disabled={index === rows.length - 1}
                className="px-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-20"
                aria-label="下移"
              >
                ▼
              </button>
            </div>

            <span className="w-10 shrink-0 rounded bg-neutral-100 px-1.5 py-1 text-center text-[11px] text-neutral-500">
              {typeBadge(row.type)}
            </span>

            {row.type === "link" ? (
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={row.label}
                  onChange={(e) => updateLink(row.key, { label: e.target.value })}
                  placeholder="链接名称,例如:GitHub"
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
                placeholder={defaultLabel(row, categories, pages, language)}
                className="min-w-0 flex-1 rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
              />
            )}

            <button
              type="button"
              onClick={() => remove(row.key)}
              className="w-8 shrink-0 px-2 pt-2 text-neutral-400 hover:text-red-600 sm:pt-0"
              aria-label="删除"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {state.error && (
        <p className="mx-4 mb-4 rounded bg-red-50 p-3 text-red-600">{state.error}</p>
      )}
      {state.saved && (
        <p className="mx-4 mb-4 rounded bg-emerald-50 p-3 text-emerald-700">
          已保存,站点将在约 1 分钟后更新。
        </p>
      )}
      <div className="border-t border-neutral-100 p-4">
        <ProgressButton
          expectedSeconds={5}
          pendingLabel="保存中"
          buildSiteId={siteId}
          className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
        >
          保存并重新构建
        </ProgressButton>
      </div>
    </form>
  );
}
