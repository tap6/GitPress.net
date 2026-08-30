"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";
import {
  bulkPostsAction,
  deletePostAction,
  updatePostMetaAction,
  type BulkPostsState,
  type UpdatePostMetaState,
} from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import type { PostSummary, SiteCategory } from "@/lib/content";
import { datetimeLocalValue, formatPostDateTime, nowLocalDateTime } from "@/lib/postDate";
import { onFormStampAuthorNow, useDateInputMax } from "@/lib/browserWallClock";

interface Props {
  siteId: string;
  posts: PostSummary[];
  categories: SiteCategory[];
  publishCheckEnabled?: boolean;
}

type Filter = "all" | "published" | "draft";
type SortKey = "title" | "category" | "tags" | "date" | "status";

export function PostsTable({ siteId, posts, categories, publishCheckEnabled = false }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [bulkState, bulkAction] = useActionState<BulkPostsState, FormData>(bulkPostsAction, {});

  const categoryLabel = useMemo(
    () => new Map(categories.map((category) => [category.slug, category.label])),
    [categories],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = posts.filter((post) => {
      if (filter === "published" && post.draft) return false;
      if (filter === "draft" && !post.draft) return false;
      if (!needle) return true;
      const hay = [
        post.title,
        post.description,
        post.tags.join(" "),
        post.category ? (categoryLabel.get(post.category) ?? post.category) : "",
        formatPostDateTime(post.date),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const cmp = (() => {
        switch (sortKey) {
          case "title":
            return a.title.localeCompare(b.title, "zh");
          case "category":
            return (categoryLabel.get(a.category ?? "") ?? "").localeCompare(
              categoryLabel.get(b.category ?? "") ?? "",
              "zh",
            );
          case "tags":
            return a.tags.join(",").localeCompare(b.tags.join(","), "zh");
          case "status":
            return Number(a.draft) - Number(b.draft);
          case "date":
          default:
            return (a.date ?? "").localeCompare(b.date ?? "");
        }
      })();
      return cmp * dir;
    });
  }, [categoryLabel, filter, posts, query, sortDir, sortKey]);

  const allVisibleSelected = visible.length > 0 && visible.every((post) => selected.has(post.path));

  function toggle(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const post of visible) next.delete(post.path);
      } else {
        for (const post of visible) next.add(post.path);
      }
      return next;
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "date" ? "desc" : "asc");
  }

  const selectedCount = [...selected].filter((path) => visible.some((post) => post.path === path)).length;

  return (
    <div className="mt-4 overflow-hidden rounded border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            全部 ({posts.length})
          </FilterChip>
          <FilterChip active={filter === "published"} onClick={() => setFilter("published")}>
            已发布 ({posts.filter((post) => !post.draft).length})
          </FilterChip>
          <FilterChip active={filter === "draft"} onClick={() => setFilter("draft")}>
            草稿 · 不公开 ({posts.filter((post) => post.draft).length})
          </FilterChip>
        </div>
        <label className="relative ml-auto">
          <span className="sr-only">搜索文章</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、标签、分类…"
            className="w-52 rounded border border-neutral-300 bg-white py-1.5 pl-3 pr-3 text-sm focus:border-wp-accent focus:outline-none"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-2.5">
        <form
          action={bulkAction}
          onSubmit={(event) => {
            const data = new FormData(event.currentTarget);
            if (data.get("op") === "delete") {
              const count = data.getAll("paths").length;
              if (!window.confirm(`确定删除选中的 ${count} 篇文章?此操作会从数据仓库移除文件。`)) {
                event.preventDefault();
              }
            }
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="siteId" value={siteId} />
          {[...selected]
            .filter((path) => visible.some((post) => post.path === path))
            .map((path) => (
              <input key={path} type="hidden" name="paths" value={path} />
            ))}
          <select
            name="op"
            required
            defaultValue=""
            disabled={selectedCount === 0}
            className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm disabled:opacity-40"
          >
            <option value="" disabled>
              批量操作
            </option>
            <option value="publish">设为已发布</option>
            <option value="draft">设为草稿(公开站点不显示)</option>
            <option value="delete">删除</option>
          </select>
          <ProgressButton
            expectedSeconds={4}
            pendingLabel="处理中"
            buildSiteId={siteId}
            disabled={selectedCount === 0}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-40"
          >
            应用
          </ProgressButton>
          {selectedCount === 0 && (
            <span className="text-xs text-neutral-400">勾选文章后可批量改状态或删除</span>
          )}
        </form>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-sky-100 bg-sky-50 px-4 py-2 text-xs text-sky-800">
          <span>已选 {selectedCount} 篇</span>
          <button type="button" onClick={() => setSelected(new Set())} className="hover:underline">
            清除选择
          </button>
        </div>
      )}
      {bulkState.error && (
        <p className="border-b border-neutral-100 bg-red-50 px-4 py-2 text-sm text-red-600">
          {bulkState.error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label="全选"
                  className="accent-wp-accent"
                />
              </th>
              <SortHeader label="标题" active={sortKey === "title"} dir={sortDir} onClick={() => toggleSort("title")} />
              <SortHeader
                className="hidden w-28 md:table-cell"
                label="分类"
                active={sortKey === "category"}
                dir={sortDir}
                onClick={() => toggleSort("category")}
              />
              <SortHeader
                className="hidden w-40 md:table-cell"
                label="标签"
                active={sortKey === "tags"}
                dir={sortDir}
                onClick={() => toggleSort("tags")}
              />
              <SortHeader
                className="hidden w-44 md:table-cell"
                label="日期"
                active={sortKey === "date"}
                dir={sortDir}
                onClick={() => toggleSort("date")}
              />
              <SortHeader
                className="w-24"
                label="状态"
                active={sortKey === "status"}
                dir={sortDir}
                onClick={() => toggleSort("status")}
              />
              <th className="w-16 px-3 py-2.5">
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">
                  {posts.length === 0
                    ? "还没有文章,点击「写文章」开始。"
                    : query.trim()
                      ? "没有符合搜索的文章。"
                      : "这一栏目前是空的。"}
                </td>
              </tr>
            )}
            {visible.map((post) => (
              <PostRow
                key={post.path}
                siteId={siteId}
                post={post}
                categories={categories}
                categoryLabel={categoryLabel}
                checked={selected.has(post.path)}
                onToggle={() => toggle(post.path)}
                editing={editingPath === post.path}
                onToggleEdit={() =>
                  setEditingPath((current) => (current === post.path ? null : post.path))
                }
                onEditDone={() => setEditingPath(null)}
                publishCheckEnabled={publishCheckEnabled}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className = "",
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={`px-4 py-2.5 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-neutral-800 ${
          active ? "text-neutral-800" : ""
        }`}
      >
        {label}
        <span className="text-[10px] text-neutral-400" aria-hidden>
          {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs ${
        active ? "bg-wp-accent text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}

function PostRow({
  siteId,
  post,
  categories,
  categoryLabel,
  checked,
  onToggle,
  editing,
  onToggleEdit,
  onEditDone,
  publishCheckEnabled,
}: {
  siteId: string;
  post: PostSummary;
  categories: SiteCategory[];
  categoryLabel: Map<string, string>;
  checked: boolean;
  onToggle: () => void;
  editing: boolean;
  onToggleEdit: () => void;
  onEditDone: () => void;
  publishCheckEnabled: boolean;
}) {
  const editHref = `/sites/${siteId}/posts/edit?path=${encodeURIComponent(post.path)}`;
  const when = formatPostDateTime(post.date);

  return (
    <>
      <tr
        className={`border-b border-neutral-100 transition-colors ${
          editing ? "bg-sky-50/60" : "hover:bg-neutral-50/80"
        }`}
      >
        <td className="px-3 py-3 align-top">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            aria-label={`选择 ${post.title}`}
            className="accent-wp-accent"
          />
        </td>
        <td className="px-4 py-3">
          <Link href={editHref} className="font-medium text-wp-accent hover:underline">
            {post.title}
          </Link>
          {post.description && (
            <p className="mt-0.5 truncate text-xs text-neutral-400">{post.description}</p>
          )}
          {(post.category || post.tags.length > 0 || post.date) && (
            <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-neutral-400 md:hidden">
              {post.category && <span>{categoryLabel.get(post.category) ?? post.category}</span>}
              {post.tags.length > 0 && <span>{post.tags.join(", ")}</span>}
              {post.date && <span className="whitespace-nowrap">{when}</span>}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs">
            <Link href={editHref} className="text-neutral-400 hover:text-wp-accent hover:underline">
              编辑
            </Link>
            <button
              type="button"
              onClick={onToggleEdit}
              className="text-neutral-400 hover:text-wp-accent hover:underline"
            >
              {editing ? "取消快速编辑" : "快速编辑"}
            </button>
          </div>
        </td>
        <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
          {post.category ? categoryLabel.get(post.category) ?? post.category : "—"}
        </td>
        <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">{post.tags.join(", ")}</td>
        <td className="hidden whitespace-nowrap px-4 py-3 text-neutral-500 md:table-cell">{when}</td>
        <td className="px-4 py-3">
          {post.draft ? (
            <span
              title="草稿写入私有仓库并会触发构建,但公开站点不显示"
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              草稿
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              已发布
            </span>
          )}
        </td>
        <td className="px-3 py-3 text-right">
          <form action={deletePostAction}>
            <input type="hidden" name="siteId" value={siteId} />
            <input type="hidden" name="path" value={post.path} />
            <ProgressButton
              expectedSeconds={3}
              pendingLabel="删除中"
              buildSiteId={siteId}
              className="text-xs text-neutral-400 hover:text-red-600 hover:underline"
            >
              删除
            </ProgressButton>
          </form>
        </td>
      </tr>
      {editing && (
        <tr className="border-b border-neutral-100 bg-sky-50/40">
          <td />
          <td colSpan={6} className="px-4 py-4">
            <QuickEditForm
              siteId={siteId}
              post={post}
              categories={categories}
              onDone={onEditDone}
              publishCheckEnabled={publishCheckEnabled}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function QuickEditForm({
  siteId,
  post,
  categories,
  onDone,
  publishCheckEnabled,
}: {
  siteId: string;
  post: PostSummary;
  categories: SiteCategory[];
  onDone: () => void;
  publishCheckEnabled: boolean;
}) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const boundAction = useMemo(
    () => async (prev: UpdatePostMetaState, formData: FormData) => {
      const result = await updatePostMetaAction(prev, formData);
      if (!result.error) onDoneRef.current();
      return result;
    },
    [],
  );
  const [state, formAction] = useActionState<UpdatePostMetaState, FormData>(boundAction, {});
  const dateMax = useDateInputMax(publishCheckEnabled, post.date);

  return (
    <form action={formAction} onSubmit={onFormStampAuthorNow} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="path" value={post.path} />
      <label className="block text-xs sm:col-span-2 lg:col-span-1">
        <span className="text-neutral-500">标题</span>
        <input
          name="title"
          required
          defaultValue={post.title}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-xs">
        <span className="text-neutral-500">分类</span>
        <select
          name="category"
          defaultValue={post.category ?? ""}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">未分类</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs">
        <span className="text-neutral-500">标签(逗号分隔)</span>
        <input
          name="tags"
          defaultValue={post.tags.join(", ")}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-xs sm:col-span-2 lg:col-span-1">
        <span className="text-neutral-500">日期时间</span>
        <input
          type="datetime-local"
          name="date"
          step={1}
          defaultValue={datetimeLocalValue(post.date, nowLocalDateTime())}
          max={dateMax}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        />
        {!publishCheckEnabled && (
          <span className="mt-1 block text-[11px] text-neutral-400">
            定时发布已关闭，不能选未来时间。
          </span>
        )}
      </label>
      <label className="block text-xs">
        <span className="text-neutral-500">状态</span>
        <select
          name="status"
          defaultValue={post.draft ? "draft" : "publish"}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="publish">已发布(公开站点可见)</option>
          <option value="draft">草稿 · 不公开(写入私有仓库,公开站点不显示)</option>
        </select>
      </label>
      <div className="flex items-end gap-3">
        <ProgressButton
          expectedSeconds={4}
          pendingLabel="保存中"
          buildSiteId={siteId}
          announceBuild={!state.error}
          className="rounded bg-wp-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-wp-accent-dark"
        >
          更新
        </ProgressButton>
        <button type="button" onClick={onDone} className="pb-1 text-xs text-neutral-400 hover:underline">
          取消
        </button>
      </div>
      {state.error && (
        <p data-form-error className="text-xs text-red-600 sm:col-span-2 lg:col-span-3">
          {state.error}
        </p>
      )}
    </form>
  );
}
