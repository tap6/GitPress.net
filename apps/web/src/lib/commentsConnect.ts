import type { Octokit } from "octokit";
import { giscusLang, pickGiscusCategory, type GiscusConfig } from "./comments";
import {
  enableRepoDiscussions,
  fetchDiscussionCategories,
  getInstallationPermissionGap,
  splitRepo,
  type PermissionGap,
} from "./github";

export class CommentsPermissionError extends Error {
  readonly permissionGap: PermissionGap | null;
  constructor(message: string, permissionGap: PermissionGap | null) {
    super(message);
    this.name = "CommentsPermissionError";
    this.permissionGap = permissionGap;
  }
}

export async function connectGiscus(
  octokit: Octokit,
  options: { siteRepo: string; language?: string; installationId: number },
): Promise<GiscusConfig> {
  const gap = await getInstallationPermissionGap(options.installationId);
  if (gap?.missing.some((item) => item.name === "discussions")) {
    throw new CommentsPermissionError("needDiscussionsRead", gap);
  }

  const ref = splitRepo(options.siteRepo);
  try {
    await enableRepoDiscussions(octokit, ref);
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 403) {
      throw new Error("discussionsPerm");
    }
    throw error;
  }

  let info;
  try {
    info = await fetchDiscussionCategories(octokit, ref);
  } catch (error) {
    if ((error as { status?: number }).status === 403 || /Resource not accessible|discussions/i.test(String(error))) {
      throw new CommentsPermissionError("discussionsReadFail", gap);
    }
    throw error;
  }

  const category = pickGiscusCategory(info.categories);
  if (!category) {
    throw new Error("discussionsCategory");
  }

  return {
    repo: options.siteRepo,
    repoId: info.repoId,
    category: category.name,
    categoryId: category.id,
    mapping: "pathname",
    lang: giscusLang(options.language),
  };
}

/**
 * Ask giscus.app whether *its* GitHub App is installed on this repo.
 * GitPress cannot see other apps via the GitHub API; this is the same check
 * the public widget uses (403 + "not installed").
 */
export async function probeGiscusApp(repo: string): Promise<boolean | null> {
  try {
    const url = new URL("https://giscus.app/api/discussions");
    url.searchParams.set("repo", repo);
    url.searchParams.set("term", "__gitpress_probe__");
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    const message = String(body.error ?? "");
    if (/giscus is not installed/i.test(message)) return false;
    if (response.status === 403 && /not installed|installation/i.test(message)) return false;
    if (response.ok || response.status === 404 || response.status === 429) return true;
    return null;
  } catch {
    return null;
  }
}

/** GitHub's install page for giscus, scoped to the site repo's owner when possible. */
export async function giscusInstallUrl(octokit: Octokit, siteRepo: string): Promise<string> {
  const fallback = "https://github.com/apps/giscus/installations/new";
  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
      ...splitRepo(siteRepo),
    });
    const targetId = data.owner?.id;
    if (!targetId) return fallback;
    return `https://github.com/apps/giscus/installations/new/permissions?target_id=${targetId}`;
  } catch {
    return fallback;
  }
}
