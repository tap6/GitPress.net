/**
 * GitHub repository names for a GitPress site (`{slug}` public, `{slug}-data`
 * private). Distinct from post/page `slugify`, which keeps Unicode letters.
 *
 * Max 95 so `{slug}-data` stays within GitHub's 100-character repo name limit.
 */
const GITHUB_REPO_SLUG = /^[a-z0-9][a-z0-9-]{0,94}$/;

export function isGithubRepoSlug(value: string): boolean {
  return GITHUB_REPO_SLUG.test(value);
}

function normalizeRepoSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Auto-generated repo name, or empty when the site name is not ASCII-safe. */
export function suggestedGithubRepoSlug(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || /[^\x00-\x7F]/.test(trimmed)) return "";
  const slug = normalizeRepoSlug(trimmed);
  return isGithubRepoSlug(slug) ? slug : "";
}

export function resolveGithubRepoSlug(name: string, slugInput: string): string | null {
  const trimmed = slugInput.trim();
  const candidate = trimmed ? normalizeRepoSlug(trimmed) : suggestedGithubRepoSlug(name);
  return isGithubRepoSlug(candidate) ? candidate : null;
}
