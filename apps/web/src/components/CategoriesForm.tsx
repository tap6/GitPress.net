"use client";

import { useActionState, useState } from "react";
import { ProgressButton } from "@/components/ProgressButton";
import { saveCategoriesAction, type SaveCategoriesState } from "@/lib/actions";
import { isCategoryInNav, type SiteCategory } from "@/lib/content";

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
    rows.map((row) => ({
      slug: row.slug || localSlugify(row.label),
      label: row.label,
      inNav: isCategoryInNav(row),
    })),
  );

  return (
    <form action={formAction} className="space-y-4 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="categoriesJson" value={categoriesJson} />

      {rows.length === 0 && (
        <p className="text-neutral-400">还没有分类,添加一个开始规划你的站点栏目吧。</p>
      )}

      {rows.length > 0 && (
        <div className="hidden items-center gap-2 pr-8 text-xs text-neutral-400 sm:flex">
          <span className="w-6 shrink-0" />
          <span className="min-w-[140px] flex-1">名称</span>
          <span className="w-40">slug</span>
          <span className="w-[4.5rem] text-center">顶栏</span>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((row, index) => {
          const inNav = isCategoryInNav(row);
          return (
            <div key={row.key} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <div className="flex shrink-0 flex-row sm:flex-col">
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
              <input
                value={row.label}
                onChange={(e) => updateLabel(row.key, e.target.value)}
                placeholder="分类名称,例如:技术"
                className="min-w-[140px] flex-1 rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
              />
              <input
                value={row.slug}
                onChange={(e) => updateSlug(row.key, e.target.value)}
                placeholder="slug,自动生成"
                className="w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs text-neutral-500 focus:border-wp-accent focus:outline-none sm:w-40"
              />
              <div
                className="flex w-[4.5rem] shrink-0 flex-col items-center gap-0.5"
                title={inNav ? "显示在站点顶部导航" : "不显示在顶部导航,归档页仍会生成"}
              >
                <span className="text-[11px] text-neutral-400 sm:hidden">顶栏</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={inNav}
                  aria-label={`${row.label || "此分类"}显示在顶部导航`}
                  onClick={() => toggleInNav(row.key)}
                  className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wp-accent focus-visible:ring-offset-1 ${
                    inNav ? "bg-wp-accent" : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      inNav ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(row.key)}
                className="shrink-0 px-2 text-neutral-400 hover:text-red-600"
                aria-label="删除"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="rounded border border-dashed border-neutral-300 px-3 py-1.5 text-neutral-500 hover:border-wp-accent hover:text-wp-accent"
      >
        + 添加分类
      </button>

      {state.error && <p className="rounded bg-red-50 p-3 text-red-600">{state.error}</p>}
      {state.saved && (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">
          已保存,站点将在约 1 分钟后更新导航。
        </p>
      )}

      <div>
        <ProgressButton
          expectedSeconds={4}
          pendingLabel="保存中"
          buildSiteId={siteId}
          className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
        >
          保存分类
        </ProgressButton>
      </div>
    </form>
  );
}
