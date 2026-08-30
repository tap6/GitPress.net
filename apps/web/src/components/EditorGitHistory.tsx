import Link from "next/link";
import {
  describeCommitAuthor,
  describeGitChange,
  formatShanghaiDateTime,
  shanghaiDayHeading,
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
  return (
    <section className="flex min-h-40 flex-1 flex-col overflow-hidden rounded border border-neutral-200 bg-white shadow-sm lg:min-h-0">
      <div className="flex shrink-0 items-baseline justify-between gap-2 border-b border-neutral-100 px-3 py-2">
        <h2 className="text-sm font-semibold text-neutral-700">Git 记录</h2>
        <Link
          href={`/sites/${siteId}/history`}
          className="text-xs leading-none text-neutral-400 hover:text-wp-accent hover:underline"
        >
          全部
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {error ? (
          <p className="text-xs leading-relaxed text-amber-700">{error}</p>
        ) : !hasFile ? (
          <p className="text-xs leading-relaxed text-neutral-400">
            保存到仓库后，这篇的改动会出现在这里。
          </p>
        ) : commits.length === 0 ? (
          <p className="text-xs leading-relaxed text-neutral-400">这篇还没有单独的提交记录。</p>
        ) : (
          <ol className="space-y-2.5">
            {commits.map((commit, index) => {
              const change = describeGitChange(commit.message);
              const day = shanghaiDayHeading(commit.committedAt);
              const prevDay =
                index > 0 ? shanghaiDayKey(commits[index - 1].committedAt) : null;
              const showDay = prevDay !== shanghaiDayKey(commit.committedAt);
              return (
                <li key={commit.sha}>
                  {showDay ? (
                    <p className="mb-1 text-xs font-medium leading-snug text-neutral-400">
                      {day}
                    </p>
                  ) : null}
                  <a
                    href={commit.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded px-0.5 py-1 hover:bg-neutral-50"
                  >
                    <p className="text-xs leading-relaxed text-neutral-700">{change.label}</p>
                    <p className="mt-1 text-[11px] leading-snug text-neutral-400">
                      {formatShanghaiDateTime(commit.committedAt)}
                      <span className="mx-1">·</span>
                      {describeCommitAuthor(commit.authorLogin, commit.authorName)}
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
