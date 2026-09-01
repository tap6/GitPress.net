"use client";

import { Link } from "@/i18n/navigation";
import { useActionState, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  bulkPostsAction,
  deletePostAction,
  updatePostMetaAction,
  type BulkPostsState,
  type UpdatePostMetaState,
} from "@/lib/actions";
import { FormError } from "@/components/FormError";
import { ProgressButton } from "@/components/ProgressButton";
import type { PostSummary, SiteCategory } from "@/lib/content";
import { formatPostDateTime, nowLocalDateTime, storedDateToInputValue } from "@/lib/postDate";
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
  const t = useTranslations("posts");
  const tc = useTranslations("common");
  const locale = useLocale();
  const collator = locale === "en" ? "en" : "zh";
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
            return a.title.localeCompare(b.title, collator);
          case "category":
            return (categoryLabel.get(a.category ?? "") ?? "").localeCompare(
              categoryLabel.get(b.category ?? "") ?? "",
              collator,
            );
          case "tags":
            return a.tags.join(",").localeCompare(b.tags.join(","), collator);
          case "status":
            return Number(a.draft) - Number(b.draft);
          case "date":
          default:
            return (a.date ?? "").localeCompare(b.date ?? "");
        }
      })();
      return cmp * dir;
    });
  }, [categoryLabel, collator, filter, posts, query, sortDir, sortKey]);

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
            {t("all", { n: posts.length })}
          </FilterChip>
          <FilterChip active={filter === "published"} onClick={() => setFilter("published")}>
            {t("publishedN", { n: posts.filter((post) => !post.draft).length })}
          </FilterChip>
          <FilterChip active={filter === "draft"} onClick={() => setFilter("draft")}>
            {t("draftN", { n: posts.filter((post) => post.draft).length })}
          </FilterChip>
        </div>
        <label className="relative ml-auto">
          <span className="sr-only">{t("searchAria")}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
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
              if (!window.confirm(t("confirmDelete", { n: count }))) {
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
              {t("bulk")}
            </option>
            <option value="publish">{t("bulkPublish")}</option>
            <option value="draft">{t("bulkDraft")}</option>
            <option value="delete">{tc("delete")}</option>
          </select>
          <ProgressButton
            expectedSeconds={4}
            pendingLabel={tc("processing")}
            buildSiteId={siteId}
            announceBuild={!bulkState.error}
            error={bulkState.error}
            disabled={selectedCount === 0}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-40"
          >
            {tc("apply")}
          </ProgressButton>
          {selectedCount === 0 && (
            <span className="text-xs text-neutral-400">{t("bulkHint")}</span>
          )}
        </form>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-sky-100 bg-sky-50 px-4 py-2 text-xs text-sky-800">
          <span>{t("selected", { n: selectedCount })}</span>
          <button type="button" onClick={() => setSelected(new Set())} className="hover:underline">
            {t("clearSelection")}
          </button>
        </div>
      )}
      <FormError error={bulkState.error} className="border-b border-neutral-100 bg-red-50 px-4 py-2 text-sm text-red-600" />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label={t("selectAll")}
                  className="accent-wp-accent"
                />
              </th>
              <SortHeader label={t("colTitle")} active={sortKey === "title"} dir={sortDir} onClick={() => toggleSort("title")} />
              <SortHeader
                className="hidden w-28 md:table-cell"
                label={t("colCategory")}
                active={sortKey === "category"}
                dir={sortDir}
                onClick={() => toggleSort("category")}
              />
              <SortHeader
                className="hidden w-40 md:table-cell"
                label={t("colTags")}
                active={sortKey === "tags"}
                dir={sortDir}
                onClick={() => toggleSort("tags")}
              />
              <SortHeader
                className="hidden w-44 md:table-cell"
                label={t("colDate")}
                active={sortKey === "date"}
                dir={sortDir}
                onClick={() => toggleSort("date")}
              />
              <SortHeader
                className="w-24"
                label={t("colStatus")}
                active={sortKey === "status"}
                dir={sortDir}
                onClick={() => toggleSort("status")}
              />
              <th className="w-16 px-3 py-2.5">
                <span className="sr-only">{t("colActions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">
                  {posts.length === 0
                    ? t("empty")
                    : query.trim()
                      ? t("emptySearch")
                      : t("emptyFilter")}
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
  const t = useTranslations("posts");
  const te = useTranslations("editor");
  const tc = useTranslations("common");
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
            aria-label={t("selectPost", { title: post.title })}
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
              {tc("edit")}
            </Link>
            <button
              type="button"
              onClick={onToggleEdit}
              className="text-neutral-400 hover:text-wp-accent hover:underline"
            >
              {editing ? te("cancelQuickEdit") : te("quickEdit")}
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
              title={t("draftTitle")}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {t("draft")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t("published")}
            </span>
          )}
        </td>
        <td className="px-3 py-3 text-right">
          <form action={deletePostAction}>
            <input type="hidden" name="siteId" value={siteId} />
            <input type="hidden" name="path" value={post.path} />
            <ProgressButton
              expectedSeconds={3}
              pendingLabel={tc("deleting")}
              buildSiteId={siteId}
              className="text-xs text-neutral-400 hover:text-red-600 hover:underline"
            >
              {tc("delete")}
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
  const t = useTranslations("posts");
  const te = useTranslations("editor");
  const tc = useTranslations("common");
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
        <span className="text-neutral-500">{t("colTitle")}</span>
        <input
          name="title"
          required
          defaultValue={post.title}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-xs">
        <span className="text-neutral-500">{t("colCategory")}</span>
        <select
          name="category"
          defaultValue={post.category ?? ""}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">{te("uncategorized")}</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs">
        <span className="text-neutral-500">{te("tags")}</span>
        <input
          name="tags"
          defaultValue={post.tags.join(", ")}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-xs sm:col-span-2 lg:col-span-1">
        <span className="text-neutral-500">{te("datetime")}</span>
        <input
          type="datetime-local"
          name="date"
          step={1}
          defaultValue={storedDateToInputValue(post.date, nowLocalDateTime())}
          max={dateMax}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        />
        {!publishCheckEnabled && (
          <span className="mt-1 block text-[11px] text-neutral-400">
            {t("scheduleOffQuick")}
          </span>
        )}
      </label>
      <label className="block text-xs">
        <span className="text-neutral-500">{te("status")}</span>
        <select
          name="status"
          defaultValue={post.draft ? "draft" : "publish"}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="publish">{te("statusPublish")}</option>
          <option value="draft">{te("statusDraft")}</option>
        </select>
      </label>
      <div className="flex items-end gap-3">
        <ProgressButton
          expectedSeconds={4}
          pendingLabel={tc("saving")}
          buildSiteId={siteId}
          announceBuild={!state.error}
          error={state.error}
          className="rounded bg-wp-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-wp-accent-dark"
        >
          {tc("update")}
        </ProgressButton>
        <button type="button" onClick={onDone} className="pb-1 text-xs text-neutral-400 hover:underline">
          {tc("cancel")}
        </button>
      </div>
      <FormError error={state.error} className="text-xs text-red-600 sm:col-span-2 lg:col-span-3 p-0 bg-transparent" />
    </form>
  );
}
