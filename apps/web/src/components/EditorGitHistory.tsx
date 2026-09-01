"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  describeGitChange,
  formatCommitAuthor,
  formatDayHeading,
  formatGitChange,
  formatShanghaiDateTime,
  shanghaiDayKey,
} from "@/lib/buildLabels";

export interface EditorGitCommit {
  sha: string;
  shortSha: string;
  message: string;
  committedAt: string;
  htmlUrl: string;
  authorLogin: string | null;
  authorName: string | null;
}

export function EditorGitHistory({
  siteId,
  commits,
  error,
  hasFile,
}: {
  siteId: string;
  commits: EditorGitCommit[];
  error?: string | null;
  hasFile: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("buildHistory");
  const th = useTranslations("history");

  return (
    <section className="flex min-h-40 flex-1 flex-col overflow-hidden rounded border border-neutral-200 bg-white shadow-sm lg:min-h-0">
      <div className="flex shrink-0 items-baseline justify-between gap-2 border-b border-neutral-100 px-3 py-2">
        <h2 className="text-sm font-semibold text-neutral-700">{th("title")}</h2>
        <Link
          href={`/sites/${siteId}/history`}
          className="text-xs leading-none text-neutral-400 hover:text-wp-accent hover:underline"
        >
          {th("all")}
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {error ? (
          <p className="text-xs leading-relaxed text-amber-700">{error}</p>
        ) : !hasFile ? (
          <p className="text-xs leading-relaxed text-neutral-400">{th("editorEmptyFile")}</p>
        ) : commits.length === 0 ? (
          <p className="text-xs leading-relaxed text-neutral-400">{th("editorEmptyCommits")}</p>
        ) : (
          <ol className="space-y-2.5">
            {commits.map((commit, index) => {
              const change = describeGitChange(commit.message);
              const day = formatDayHeading(commit.committedAt, locale, t);
              const prevDay = index > 0 ? shanghaiDayKey(commits[index - 1].committedAt) : null;
              const showDay = prevDay !== shanghaiDayKey(commit.committedAt);
              return (
                <li key={commit.sha}>
                  {showDay ? (
                    <p className="mb-1 text-xs font-medium leading-snug text-neutral-400">{day}</p>
                  ) : null}
                  <a
                    href={commit.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded px-0.5 py-1 hover:bg-neutral-50"
                  >
                    <p className="text-xs leading-relaxed text-neutral-700">{formatGitChange(change, t)}</p>
                    <p className="mt-1 text-[11px] leading-snug text-neutral-400">
                      {formatShanghaiDateTime(commit.committedAt, locale)}
                      <span className="mx-1">·</span>
                      {formatCommitAuthor(commit.authorLogin, commit.authorName, t)}
                    </p>
                  </a>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
