import { existsSync, readFileSync } from "node:fs";
import { getCollection, type CollectionEntry } from "astro:content";

interface SiteCategory {
  slug: string;
  label: string;
  /** When false, omit from top nav. Missing means true. */
  inNav?: boolean;
}

interface SiteInfo {
  title: string;
  description?: string;
  language?: string;
  url?: string;
  basePath?: string;
  author?: string;
  analyticsSnippet?: string;
  categories?: SiteCategory[];
  postsPerPage?: number;
}

interface GitPressConfig {
  schemaVersion: number;
  site: SiteInfo;
  theme?: { name?: string; config?: Record<string, unknown> };
}

const FALLBACK: GitPressConfig = {
  schemaVersion: 1,
  site: {
    title: "GitPress Dev",
    description: "Local theme development preview",
    language: "en",
  },
};

function loadConfig(): GitPressConfig {
  const path = new URL("../../gitpress.config.json", import.meta.url);
  if (!existsSync(path)) return FALLBACK;
  return JSON.parse(readFileSync(path, "utf8")) as GitPressConfig;
}

export const gitpress = loadConfig();

/** Theme option defaults — absent options always fall back so old sites keep building. */
export const themeConfig = {
  accentColor: "#2563eb",
  showExcerpts: false,
  ...(gitpress.theme?.config ?? {}),
} as { accentColor: string; showExcerpts: boolean } & Record<string, unknown>;

export type Post = CollectionEntry<"posts">;
export type Page = CollectionEntry<"pages">;

/** Ordered, site-owner-maintained categories — drives archive pages. */
export const siteCategories: SiteCategory[] = gitpress.site.categories ?? [];
/** Categories shown in the top nav. Absent `inNav` is treated as true. */
export const navCategories: SiteCategory[] = siteCategories.filter((category) => category.inNav !== false);
export const postsPerPage: number = gitpress.site.postsPerPage ?? 10;

export function categoryLabel(slug: string): string {
  return siteCategories.find((c) => c.slug === slug)?.label ?? slug;
}

export async function getPublishedPosts(): Promise<Post[]> {
  const includeDrafts = process.env.GITPRESS_INCLUDE_DRAFTS === "true";
  const posts = await getCollection("posts");
  return posts
    .filter((p) => includeDrafts || (p.data.draft !== true && p.data.date != null))
    .sort(
      (a, b) =>
        (b.data.date ? b.data.date.getTime() : 0) - (a.data.date ? a.data.date.getTime() : 0),
    );
}

export async function getPostsByCategory(slug: string): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => (post.data.categories ?? []).includes(slug));
}

export function postSlug(post: Post | Page): string {
  return post.data.slug ?? post.id;
}

export function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat(gitpress.site.language ?? "en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Prefix a root-relative path with the site base path. */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL;
  const prefix = base === "/" ? "" : base.replace(/\/$/, "");
  if (!path.startsWith("/")) return path;
  return prefix + path;
}
