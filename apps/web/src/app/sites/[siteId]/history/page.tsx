import Link from "next/link";
import { refreshGitHistoryAction } from "@/lib/actions";
import {
  describeCommitAuthor,
  describeGitChange,
  formatShanghaiDateTime,
  shanghaiDayHeading,
  shanghaiDayKey,
  type GitChangeKind,
} from "@/lib/buildLabels";
import { getInstallationOctokit, listRepoCommits, splitRepo } from "@/lib/github";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "Git 记录" };

const KIND_CLASS: Record<GitChangeKind, string> = {
  post: "bg-sky-50 text-sky-800",
  page: "bg-indigo-50 text-indigo-800",
  media: "bg-amber-50 text-amber-800",
  theme: "bg-violet-50 text-violet-800",
  settings: "bg-slate-100 text-slate-700",
  nav: "bg-teal-50 text-teal-800",
  build: "bg-neutral-100 text-neutral-600",
  init: "bg-emerald-50 text-emerald-800",
  other: "bg-neutral-100 text-neutral-600",
};

export default async function GitHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { siteId } = await params;
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);
  const { site, installation } = await requireSite(siteId);

  const octokit = await getInstallationOctokit(installation.installationId);
  const history = await listRepoCommits(octokit, splitRepo(site.dataRepo), { page, perPage: 25 });

  const groups: Array<{ heading: string; items: typeof history.commits }> = [];
  for (const commit of history.commits) {
    const heading = shanghaiDayHeading(commit.committedAt);
    const last = groups[groups.length - 1];
    if (last && shanghaiDayKey(last.items[0].committedAt) === shanghaiDayKey(commit.committedAt)) {
      last.items.push(commit);
    } else {
      groups.push({ heading, items: [commit] });
    }
  }

  const hrefFor = (nextPage: number) =>
    nextPage <= 1 ? `/sites/${siteId}/history` : `/sites/${siteId}/history?page=${nextPage}`;

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-normal text-neutral-800">Git 记录</h1>
          <p className="mt-2 text-sm text-neutral-500">
            每一次保存文章、换主题、改设置，都会在你的私有数据仓库里留下一条版本。这里用白话列出最近的改动；点开即可到
            GitHub 查看原文（数据仓库是私有的，需要登录 GitHub）。
          </p>
        </div>
        <form action={refreshGitHistoryAction}>
          <input type="hidden" name="siteId" value={siteId} />
          {page > 1 ? <input type="hidden" name="page" value={String(page)} /> : null}
          <button
            type="submit"
            className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-600 hover:border-wp-accent hover:text-wp-accent"
          >
            刷新
          </button>
        </form>
      </div>

      <p className="mt-3 text-xs text-neutral-400">
        来源：
        <a
          href={`https://github.com/${site.dataRepo}/commits`}
          target="_blank"
          rel="noreferrer"
          className="text-wp-accent hover:underline"
        >
          {site.dataRepo}
        </a>
        （私有数据仓库）。公开网站仓库是编译结果，一般不用看。
      </p>

      {history.error ? (
        <div className="mt-6 rounded border-l-4 border-amber-500 bg-white p-4 text-sm text-neutral-700 shadow-sm">
          {history.error}
        </div>
      ) : history.commits.length === 0 ? (
        <div className="mt-6 rounded border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm">
          {page > 1 ? "没有更多记录了。" : "还没有任何记录。保存一篇文章或修改设置后，就会出现在这里。"}
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map((group) => (
            <section key={shanghaiDayKey(group.items[0].committedAt)}>
              <h2 className="mb-3 text-xs font-semibold text-neutral-400">{group.heading}</h2>
              <ol className="overflow-hidden rounded border border-neutral-200 bg-white shadow-sm">
                {group.items.map((commit, index) => {
                  const change = describeGitChange(commit.message);
                  return (
                    <li
                      key={commit.sha}
                      className={`flex flex-col gap-2 px-5 py-4 sm:flex-row sm:gap-4 ${index > 0 ? "border-t border-neutral-100" : ""}`}
                    >
                      <div className="w-12 shrink-0 pt-0.5 text-xs tabular-nums text-neutral-400">
                        {formatShanghaiDateTime(commit.committedAt)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${KIND_CLASS[change.kind]}`}
                          >
                            {change.kindLabel}
                          </span>
                          <p className="min-w-0 break-words font-medium text-neutral-800">{change.label}</p>
                        </div>
                        <p className="mt-1 text-xs text-neutral-400">
                          {describeCommitAuthor(commit.authorLogin, commit.authorName)}
                          <span className="mx-1.5">·</span>
                          <span className="font-mono">{commit.shortSha}</span>
                        </p>
                      </div>
                      <a
                        href={commit.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 self-start text-xs text-wp-accent hover:underline sm:self-center"
                      >
                        在 GitHub 查看
                      </a>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      {(history.hasPrev || history.hasNext) && (
        <nav
          aria-label="分页导航"
          className="mt-8 flex items-center justify-between gap-3 border-t border-neutral-200 pt-5"
        >
          {history.hasPrev ? (
            <Link
              href={hrefFor(page - 1)}
              className="inline-flex rounded border border-wp-accent px-3 py-1.5 text-sm text-wp-accent hover:bg-wp-accent hover:text-white"
            >
              ← 上一页
            </Link>
          ) : (
            <span className="inline-flex cursor-not-allowed rounded border border-neutral-200 px-3 py-1.5 text-sm text-neutral-300">
              ← 上一页
            </span>
          )}
          <span className="text-sm tabular-nums text-neutral-500">
            {history.lastPage != null ? `${page} / ${history.lastPage}` : `第 ${page} 页`}
          </span>
          {history.hasNext ? (
            <Link
              href={hrefFor(page + 1)}
              className="inline-flex rounded border border-wp-accent px-3 py-1.5 text-sm text-wp-accent hover:bg-wp-accent hover:text-white"
            >
              下一页 →
            </Link>
          ) : (
            <span className="inline-flex cursor-not-allowed rounded border border-neutral-200 px-3 py-1.5 text-sm text-neutral-300">
              下一页 →
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
