import matter from "gray-matter";
import type { Octokit } from "octokit";
import { persistSiteCategory, type SiteCategory } from "./categories";
import { deleteFile, getFileText, listDirectory, putFile, commitFiles, splitRepo } from "./github";
import { sanitizeMediaFileName, uniqueMediaFileName } from "./mediaName";
import { persistNavItem, type NavItem } from "./nav";
import { parseFooterItem, persistBeian, persistFooterItem, type FooterItem, type SiteBeian } from "./footer";

export type { SiteCategory } from "./categories";
export { isCategoryInNav, persistSiteCategory } from "./categories";
export type { NavItem } from "./nav";
export type { FooterItem, SiteBeian } from "./footer";

/** Content operations = commits against the private data repository. */

export interface PostSummary {
  /** Repo path, e.g. content/posts/hello-world.md */
  path: string;
  file: string;
  title: string;
  date: string | null;
  draft: boolean;
  tags: string[];
  /** Single-select category slug (stored as the first element of the `categories` array). */
  category: string | null;
  description: string;
}

export interface PostDetail extends PostSummary {
  body: string;
  sha: string;
}

export async function listPosts(octokit: Octokit, dataRepo: string): Promise<PostSummary[]> {
  const ref = splitRepo(dataRepo);
  const files = await listDirectory(octokit, ref, "content/posts");
  const mdFiles = files.filter((file) => file.name.endsWith(".md"));
  // Fetching each file's contents is a separate GitHub API round-trip; doing
  // this serially made the posts list visibly slow once a site had more than
  // a handful of posts, which was part of the "loading feels slow" feedback.
  const results = await Promise.all(
    mdFiles.map(async (file) => {
      const raw = await getFileText(octokit, ref, file.path);
      if (!raw) return null;
      return summarize(file.path, file.name, raw.text);
    }),
  );
  const posts = results.filter((post): post is PostSummary => post !== null);
  return posts.sort((a, b) => (b.date ?? "9999").localeCompare(a.date ?? "9999"));
}

function summarize(path: string, file: string, text: string): PostSummary {
  const { data } = matter(text);
  const categories = Array.isArray(data.categories) ? data.categories.map(String) : [];
  return {
    path,
    file,
    title: typeof data.title === "string" ? data.title : file.replace(/\.md$/, ""),
    date: data.date ? String(data.date).slice(0, 10) : null,
    draft: data.draft === true,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    category: categories[0] ?? null,
    description: typeof data.description === "string" ? data.description : "",
  };
}

export async function getPost(
  octokit: Octokit,
  dataRepo: string,
  path: string,
): Promise<PostDetail | null> {
  const ref = splitRepo(dataRepo);
  const raw = await getFileText(octokit, ref, path);
  if (!raw) return null;
  const parsed = matter(raw.text);
  const summary = summarize(path, path.split("/").pop() ?? path, raw.text);
  return { ...summary, body: parsed.content.replace(/^\n/, ""), sha: raw.sha };
}

export interface SavePostInput {
  title: string;
  date: string;
  draft: boolean;
  tags: string[];
  /** Single-select category slug, or empty/undefined for "no category". */
  category?: string;
  description: string;
  body: string;
}

export function slugify(input: string, emptyPrefix = "post"): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `${emptyPrefix}-${Date.now()}`;
}

export async function savePost(
  octokit: Octokit,
  dataRepo: string,
  path: string,
  input: SavePostInput,
  isNew: boolean,
  media: Array<{ name: string; base64: string }> = [],
): Promise<void> {
  const ref = splitRepo(dataRepo);
  // Read-modify-write instead of rebuilding frontmatter from scratch, so any
  // field this app doesn't know about yet (added by a theme, a future
  // GitPress version, or hand-edited by the user) survives a save from here.
  const existing = isNew ? null : await getFileText(octokit, ref, path);
  const frontmatter: Record<string, unknown> = existing ? matter(existing.text).data : {};

  frontmatter.title = input.title;
  frontmatter.date = input.date;
  if (input.draft) frontmatter.draft = true;
  else delete frontmatter.draft;
  if (input.tags.length > 0) frontmatter.tags = input.tags;
  else delete frontmatter.tags;
  if (input.category) frontmatter.categories = [input.category];
  else delete frontmatter.categories;
  if (input.description) frontmatter.description = input.description;
  else delete frontmatter.description;

  const text = matter.stringify(`\n${input.body.trim()}\n`, frontmatter);
  const files = [
    ...media.map((item) => ({
      path: `media/${sanitizeMediaFileName(item.name)}`,
      base64: item.base64,
    })),
    { path, utf8: text },
  ];
  const message =
    media.length > 0
      ? `${isNew ? "Add" : "Update"} post: ${input.title} (+${media.length} image${media.length === 1 ? "" : "s"})`
      : `${isNew ? "Add" : "Update"} post: ${input.title}`;
  await commitFiles(octokit, ref, files, message);
}

export interface UpdatePostMetaInput {
  title?: string;
  date?: string;
  draft?: boolean;
  tags?: string[];
  /** `null` clears the category; omit to leave it unchanged. */
  category?: string | null;
}

/**
 * Update frontmatter only (title / date / draft / tags / category), leaving
 * the Markdown body and any unknown fields untouched. Used by the posts-list
 * quick-edit and bulk status actions so we don't have to round-trip the
 * full editor.
 */
export async function updatePostMeta(
  octokit: Octokit,
  dataRepo: string,
  path: string,
  input: UpdatePostMetaInput,
): Promise<void> {
  const ref = splitRepo(dataRepo);
  const existing = await getFileText(octokit, ref, path);
  if (!existing) throw new Error("文章不存在");
  const parsed = matter(existing.text);
  const frontmatter: Record<string, unknown> = parsed.data ?? {};

  if (input.title !== undefined) frontmatter.title = input.title;
  if (input.date !== undefined) frontmatter.date = input.date;
  if (input.draft !== undefined) {
    if (input.draft) frontmatter.draft = true;
    else delete frontmatter.draft;
  }
  if (input.tags !== undefined) {
    if (input.tags.length > 0) frontmatter.tags = input.tags;
    else delete frontmatter.tags;
  }
  if (input.category !== undefined) {
    if (input.category) frontmatter.categories = [input.category];
    else delete frontmatter.categories;
  }

  const body = parsed.content.replace(/^\n/, "");
  const text = matter.stringify(`\n${body.trim()}\n`, frontmatter);
  await putFile(
    octokit,
    ref,
    path,
    { utf8: text },
    `Update post meta: ${String(frontmatter.title ?? path)}`,
  );
}

export function parseTagList(input: string): string[] {
  return input
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function deletePost(octokit: Octokit, dataRepo: string, path: string): Promise<void> {
  await deleteFile(octokit, splitRepo(dataRepo), path, `Delete post: ${path}`);
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export interface MediaItem {
  path: string;
  name: string;
  size: number;
  /** Git blob sha — used to cache previews immutably. */
  sha: string;
}

export async function listMedia(octokit: Octokit, dataRepo: string): Promise<MediaItem[]> {
  const files = await listDirectory(octokit, splitRepo(dataRepo), "media");
  return files
    .filter((file) => file.name !== ".gitkeep")
    .map((file) => ({
      path: file.path,
      name: file.name,
      size: file.size,
      sha: file.sha,
    }));
}

export async function uploadMedia(
  octokit: Octokit,
  dataRepo: string,
  fileName: string,
  base64: string,
): Promise<string> {
  // Editor uploads already send a unique name; media-library uploads get one here.
  const looksUnique = /-\d{10,}\.[a-z0-9]+$/i.test(fileName);
  const safeName = looksUnique
    ? sanitizeMediaFileName(fileName)
    : uniqueMediaFileName(fileName);
  const path = `media/${safeName}`;
  await putFile(octokit, splitRepo(dataRepo), path, { base64 }, `Upload media: ${safeName}`);
  return `/${path}`;
}

export async function deleteMedia(
  octokit: Octokit,
  dataRepo: string,
  path: string,
): Promise<void> {
  await deleteFile(octokit, splitRepo(dataRepo), path, `Delete media: ${path}`);
}

// ---------------------------------------------------------------------------
// Site configuration (gitpress.json)
// ---------------------------------------------------------------------------

export interface SiteConfig {
  schemaVersion: number;
  site: Record<string, unknown> & { title?: string };
  theme: Record<string, unknown> & { name?: string; config?: Record<string, unknown> };
  [key: string]: unknown;
}

export async function getSiteConfig(
  octokit: Octokit,
  dataRepo: string,
): Promise<SiteConfig | null> {
  const raw = await getFileText(octokit, splitRepo(dataRepo), "gitpress.json");
  if (!raw) return null;
  try {
    return JSON.parse(raw.text) as SiteConfig;
  } catch {
    return null;
  }
}

/**
 * Non-destructive config update: read-modify-write that preserves any fields
 * we do not know about (forward compatibility with future schema additions).
 */
export async function updateSiteConfig(
  octokit: Octokit,
  dataRepo: string,
  mutate: (config: SiteConfig) => void,
  message: string,
): Promise<SiteConfig> {
  const config = (await getSiteConfig(octokit, dataRepo)) ?? {
    schemaVersion: 1,
    site: { title: "My Site" },
    theme: { name: "classic", source: "builtin", ref: "v1", config: {} },
  };
  mutate(config);
  await putFile(
    octokit,
    splitRepo(dataRepo),
    "gitpress.json",
    { utf8: `${JSON.stringify(config, null, 2)}\n` },
    message,
  );
  return config;
}

// ---------------------------------------------------------------------------
// Categories (site-level, ordered list maintained by the site owner)
// ---------------------------------------------------------------------------

export async function getSiteCategories(
  octokit: Octokit,
  dataRepo: string,
): Promise<SiteCategory[]> {
  const config = await getSiteConfig(octokit, dataRepo);
  const categories = config?.site.categories;
  if (!Array.isArray(categories)) return [];
  return categories
    .filter(
      (item): item is SiteCategory =>
        !!item &&
        typeof item === "object" &&
        typeof (item as SiteCategory).slug === "string" &&
        typeof (item as SiteCategory).label === "string",
    )
    .map((item) => persistSiteCategory(item));
}

export async function saveSiteCategories(
  octokit: Octokit,
  dataRepo: string,
  categories: SiteCategory[],
): Promise<void> {
  await updateSiteConfig(
    octokit,
    dataRepo,
    (config) => {
      config.site.categories = categories.map(persistSiteCategory);
    },
    "Update categories",
  );
}

// ---------------------------------------------------------------------------
// Standalone pages (content/pages/*.md — about, contact, ...)
// ---------------------------------------------------------------------------

/** First-path segments themes already use at the site root (`/{slug}/`). */
export const RESERVED_PAGE_SLUGS = new Set([
  "posts",
  "categories",
  "tags",
  "rss",
  "rss.xml",
  "archive",
  "media",
]);

export function isReservedPageSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return true;
  if (RESERVED_PAGE_SLUGS.has(normalized)) return true;
  return /^\d+$/.test(normalized);
}

export function isPagePath(path: string): boolean {
  return path.startsWith("content/pages/") && path.endsWith(".md") && !path.includes("..");
}

export interface SitePage {
  /** Repo path, e.g. content/pages/about.md */
  path: string;
  slug: string;
  title: string;
  description: string;
}

export interface PageDetail extends SitePage {
  body: string;
  sha: string;
}

function summarizePage(path: string, file: string, text: string): SitePage {
  const { data } = matter(text);
  const fallbackSlug = file.replace(/\.md$/, "");
  const slug = typeof data.slug === "string" && data.slug ? data.slug : fallbackSlug;
  const title = typeof data.title === "string" && data.title ? data.title : slug;
  return {
    path,
    slug,
    title,
    description: typeof data.description === "string" ? data.description : "",
  };
}

export async function listPages(octokit: Octokit, dataRepo: string): Promise<SitePage[]> {
  const ref = splitRepo(dataRepo);
  const files = await listDirectory(octokit, ref, "content/pages");
  const mdFiles = files.filter((file) => file.name.endsWith(".md"));
  const results = await Promise.all(
    mdFiles.map(async (file) => {
      const raw = await getFileText(octokit, ref, file.path);
      if (!raw) return null;
      return summarizePage(file.path, file.name, raw.text);
    }),
  );
  return results
    .filter((page): page is SitePage => page !== null)
    .sort((a, b) => a.title.localeCompare(b.title, "zh"));
}

export async function getPage(
  octokit: Octokit,
  dataRepo: string,
  path: string,
): Promise<PageDetail | null> {
  if (!isPagePath(path)) return null;
  const ref = splitRepo(dataRepo);
  const raw = await getFileText(octokit, ref, path);
  if (!raw) return null;
  const parsed = matter(raw.text);
  const summary = summarizePage(path, path.split("/").pop() ?? path, raw.text);
  return { ...summary, body: parsed.content.replace(/^\n/, ""), sha: raw.sha };
}

export interface SavePageInput {
  title: string;
  description: string;
  body: string;
}

export async function savePage(
  octokit: Octokit,
  dataRepo: string,
  path: string,
  input: SavePageInput,
  isNew: boolean,
  media: Array<{ name: string; base64: string }> = [],
): Promise<void> {
  if (!isPagePath(path)) throw new Error("Invalid path");
  const ref = splitRepo(dataRepo);
  if (isNew) {
    const clash = await getFileText(octokit, ref, path);
    if (clash) throw new Error("这个标识已经有一页了,请换一个。");
  }
  const existing = isNew ? null : await getFileText(octokit, ref, path);
  const frontmatter: Record<string, unknown> = existing ? matter(existing.text).data : {};

  frontmatter.title = input.title;
  if (input.description) frontmatter.description = input.description;
  else delete frontmatter.description;

  const text = matter.stringify(`\n${input.body.trim()}\n`, frontmatter);
  const files = [
    ...media.map((item) => ({
      path: `media/${sanitizeMediaFileName(item.name)}`,
      base64: item.base64,
    })),
    { path, utf8: text },
  ];
  const message =
    media.length > 0
      ? `${isNew ? "Add" : "Update"} page: ${input.title} (+${media.length} image${media.length === 1 ? "" : "s"})`
      : `${isNew ? "Add" : "Update"} page: ${input.title}`;
  await commitFiles(octokit, ref, files, message);
}

/** Append a page to an already-saved top nav. No-op when nav is still implicit. */
export async function addPageToNav(
  octokit: Octokit,
  dataRepo: string,
  slug: string,
): Promise<void> {
  const nav = await getSiteNav(octokit, dataRepo);
  if (!nav) return;
  if (nav.some((item) => item.type === "page" && item.slug === slug)) return;
  await saveSiteNav(octokit, dataRepo, [...nav, { type: "page", slug }]);
}

export async function deletePage(octokit: Octokit, dataRepo: string, path: string): Promise<void> {
  if (!isPagePath(path)) throw new Error("Invalid path");
  const page = await getPage(octokit, dataRepo, path);
  await deleteFile(octokit, splitRepo(dataRepo), path, `Delete page: ${page?.title ?? path}`);
  if (page) await removePageFromChrome(octokit, dataRepo, page.slug);
}

function chromeHasPage(items: unknown, slug: string): boolean {
  return (
    Array.isArray(items) &&
    items.some(
      (item) =>
        !!item &&
        typeof item === "object" &&
        (item as { type?: string }).type === "page" &&
        (item as { slug?: string }).slug === slug,
    )
  );
}

async function removePageFromChrome(
  octokit: Octokit,
  dataRepo: string,
  slug: string,
): Promise<void> {
  const config = await getSiteConfig(octokit, dataRepo);
  if (!chromeHasPage(config?.site.nav, slug) && !chromeHasPage(config?.site.footer, slug)) return;
  await updateSiteConfig(
    octokit,
    dataRepo,
    (next) => {
      if (Array.isArray(next.site.nav)) {
        next.site.nav = (next.site.nav as NavItem[])
          .filter((item) => !(item.type === "page" && item.slug === slug))
          .map(persistNavItem);
      }
      if (Array.isArray(next.site.footer)) {
        next.site.footer = (next.site.footer as FooterItem[])
          .filter((item) => !(item.type === "page" && item.slug === slug))
          .map(persistFooterItem);
      }
    },
    "Update menu",
  );
}

// ---------------------------------------------------------------------------
// Top-nav menu (site-level, ordered list maintained by the site owner)
// ---------------------------------------------------------------------------

export async function getSiteNav(octokit: Octokit, dataRepo: string): Promise<NavItem[] | null> {
  const config = await getSiteConfig(octokit, dataRepo);
  const nav = config?.site.nav;
  if (!Array.isArray(nav)) return null;
  return nav
    .filter((item): item is NavItem => !!item && typeof item === "object" && typeof (item as NavItem).type === "string")
    .map((item) => persistNavItem(item));
}

export async function saveSiteNav(
  octokit: Octokit,
  dataRepo: string,
  nav: NavItem[],
): Promise<void> {
  await updateSiteConfig(
    octokit,
    dataRepo,
    (config) => {
      config.site.nav = nav.map(persistNavItem);
    },
    "Update menu",
  );
}

// ---------------------------------------------------------------------------
// Footer (site-level chrome + optional mainland-China 备案)
// ---------------------------------------------------------------------------

export async function getSiteFooter(
  octokit: Octokit,
  dataRepo: string,
): Promise<FooterItem[] | null> {
  const config = await getSiteConfig(octokit, dataRepo);
  const footer = config?.site.footer;
  if (!Array.isArray(footer)) return null;
  return footer.map(parseFooterItem).filter((item): item is FooterItem => item !== null);
}

export async function saveSiteFooter(
  octokit: Octokit,
  dataRepo: string,
  footer: FooterItem[],
): Promise<void> {
  await updateSiteConfig(
    octokit,
    dataRepo,
    (config) => {
      config.site.footer = footer.map(persistFooterItem);
    },
    "Update footer",
  );
}

export async function getSiteBeian(octokit: Octokit, dataRepo: string): Promise<SiteBeian> {
  const config = await getSiteConfig(octokit, dataRepo);
  return persistBeian(config?.site.beian) ?? {};
}

export async function saveSiteBeian(
  octokit: Octokit,
  dataRepo: string,
  beian: SiteBeian,
): Promise<void> {
  await updateSiteConfig(
    octokit,
    dataRepo,
    (config) => {
      const next = persistBeian(beian);
      if (next) config.site.beian = next;
      else delete config.site.beian;
    },
    "Update beian",
  );
}
