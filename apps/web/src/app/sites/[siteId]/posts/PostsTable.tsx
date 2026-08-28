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

interface Props {
  siteId: string;
  posts: PostSummary[];
  categories: SiteCategory[];
}

type Filter = "all" | "published" | "draft";

export function PostsTable({ siteId, posts, categories }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [bulkState, bulkAction] = useActionState<BulkPostsState, FormData>(bulkPostsAction, {});

  const categoryLabel = useMemo(
    () => new Map(categories.map((category) => [category.slug, category.label])),
    [categories],
  );

  const visible = posts.filter((post) => {
    if (filter === "published") return !post.draft;
    if (filter === "draft") return post.draft;
    return true;
  });
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

  const selectedCount = [...selected].filter((path) => visible.some((post) => post.path === path)).length;

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
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
        className="mt-3 flex flex-wrap items-center gap-2"
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
          className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="" disabled>
            批量操作
          </option>
          <option value="publish">设为已发布</option>
          <option value="draft">设为草稿(不公开)</option>
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
        <span className="text-xs text-neutral-400">
          {selectedCount > 0 ? `已选 ${selectedCount} 篇` : "左侧勾选后可批量改状态或删除"}
        </span>
      </form>
      {bulkState.error && (
        <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-600">{bulkState.error}</p>
      )}

      <div className="mt-3 overflow-x-auto rounded border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label="全选"
                  className="accent-wp-accent"
                />
              </th>
              <th className="px-4 py-2.5 font-medium">标题</th>
              <th className="hidden w-28 px-4 py-2.5 font-medium md:table-cell">分类</th>
              <th className="hidden w-40 px-4 py-2.5 font-medium md:table-cell">标签</th>
              <th className="hidden w-28 px-4 py-2.5 font-medium md:table-cell">日期</th>
              <th className="w-28 px-4 py-2.5 font-medium">状态</th>
              <th className="w-16 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                  {posts.length === 0 ? "还没有文章,点击「写文章」开始。" : "这一栏目前是空的。"}
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
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
}) {
  const editHref = `/sites/${siteId}/posts/edit?path=${encodeURIComponent(post.path)}`;

  return (
    <>
      <tr className={`border-b border-neutral-100 ${editing ? "bg-sky-50/60" : ""}`}>
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
              {post.date && <span>{post.date}</span>}
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
        <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">{post.date ?? "—"}</td>
        <td className="px-4 py-3">
          {post.draft ? (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">草稿 · 不公开</span>
          ) : (
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">已发布</span>
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
              className="text-xs text-red-500 hover:underline"
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
}: {
  siteId: string;
  post: PostSummary;
  categories: SiteCategory[];
  onDone: () => void;
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

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      <label className="block text-xs">
        <span className="text-neutral-500">日期</span>
        <input
          type="date"
          name="date"
          defaultValue={post.date ?? ""}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-xs">
        <span className="text-neutral-500">状态</span>
        <select
          name="status"
          defaultValue={post.draft ? "draft" : "publish"}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="publish">已发布(公开站点可见)</option>
          <option value="draft">草稿 · 不公开(不进入构建)</option>
        </select>
      </label>
      <div className="flex items-end gap-3">
        <ProgressButton
          expectedSeconds={4}
          pendingLabel="保存中"
          buildSiteId={siteId}
          className="rounded bg-wp-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-wp-accent-dark"
        >
          更新
        </ProgressButton>
        <button type="button" onClick={onDone} className="pb-1 text-xs text-neutral-400 hover:underline">
          取消
        </button>
      </div>
      {state.error && <p className="text-xs text-red-600 sm:col-span-2 lg:col-span-3">{state.error}</p>}
    </form>
  );
}
