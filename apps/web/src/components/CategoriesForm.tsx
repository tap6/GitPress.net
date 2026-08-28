"use client";

import { useActionState, useState } from "react";
import { ProgressButton } from "@/components/ProgressButton";
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
        <p className="text-xs text-neutral-400">
          列表顺序就是顶栏顺序。关掉导航的分类仍会生成归档页。
        </p>
        <button
          type="button"
          onClick={addRow}
          className="rounded border border-dashed border-neutral-300 px-3 py-1.5 text-neutral-500 hover:border-wp-accent hover:text-wp-accent"
        >
          + 添加分类
        </button>
      </div>

      <div className="space-y-3 p-4">
        {rows.length === 0 && (
          <p className="text-neutral-400">还没有分类,添加一个开始规划你的站点栏目吧。</p>
        )}

        {rows.length > 0 && (
          <div className="hidden items-center gap-2 text-xs text-neutral-400 sm:flex">
            <span className="w-6 shrink-0" />
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_10rem_7rem] items-center gap-2">
              <span>名称</span>
              <span>slug</span>
              <span className="text-center">顶栏导航</span>
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
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_7rem] sm:items-center">
                  <input
                    value={row.label}
                    onChange={(e) => updateLabel(row.key, e.target.value)}
                    placeholder="分类名称,例如:技术"
                    className="min-w-0 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
                  />
                  <input
                    value={row.slug}
                    onChange={(e) => updateSlug(row.key, e.target.value)}
                    placeholder="slug,自动生成"
                    className="w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs text-neutral-500 focus:border-wp-accent focus:outline-none"
                  />
                  <div
                    className="flex items-center justify-between gap-2 sm:justify-center"
                    title={inNav ? "显示在站点顶部导航" : "不显示在顶部导航,归档页仍会生成"}
                  >
                    <span className="text-[11px] text-neutral-400 sm:hidden">顶栏导航</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inNav}
                      aria-label={`${row.label || "此分类"}显示在顶部导航`}
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
                      {inNav ? "显示" : "隐藏"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(row.key)}
                  className="w-8 shrink-0 px-2 pt-2 text-neutral-400 hover:text-red-600 sm:pt-0"
                  aria-label="删除"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {state.error && (
        <p className="mx-4 mb-3 rounded bg-red-50 p-3 text-red-600">{state.error}</p>
      )}
      {state.saved && (
        <p className="mx-4 mb-3 rounded bg-emerald-50 p-3 text-emerald-700">
          已保存,站点将在约 1 分钟后更新导航。
        </p>
      )}

      <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
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
