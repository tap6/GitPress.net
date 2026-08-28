import { existsSync, readFileSync } from "node:fs";
import { getCollection, type CollectionEntry } from "astro:content";

interface SiteCategory {
  slug: string;
  label: string;
  /** When false, omit from top nav. Missing means true. */
  inNav?: boolean;
}

/** See @gitpress/spec's NavItem — duplicated here so this theme has no runtime dependency on the spec package. */
export type NavItem =
  | { type: "home"; label?: string }
  | { type: "rss"; label?: string }
  | { type: "category"; slug: string; label?: string }
  | { type: "page"; slug: string; label?: string }
  | { type: "link"; url: string; label: string };

interface SiteInfo {
  title: string;
  description?: string;
  language?: string;
  url?: string;
  basePath?: string;
  author?: string;
  analyticsSnippet?: string;
  logo?: string;
  avatar?: string;
  categories?: SiteCategory[];
  postsPerPage?: number;
  nav?: NavItem[];
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
  accentColor: "#5b5bd6",
  showReadingTime: true,
  defaultAppearance: "system",
  showLogo: true,
  showAvatar: false,
  showTitle: true,
  showTagline: true,
  ...(gitpress.theme?.config ?? {}),
} as {
  accentColor: string;
  showReadingTime: boolean;
  defaultAppearance: "system" | "light" | "dark";
  showLogo: boolean;
  showAvatar: boolean;
  showTitle: boolean;
  showTagline: boolean;
} & Record<string, unknown>;

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

/** Rough reading time from the raw markdown body, at 200 words/minute (~500 CJK characters/minute). */
export function readingTime(body: string): number {
  const cjkChars = body.match(/[\u3000-\u9fff\uf900-\ufaff]/g)?.length ?? 0;
  const latinWords = body
    .replace(/[\u3000-\u9fff\uf900-\ufaff]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = latinWords / 200 + cjkChars / 500;
  return Math.max(1, Math.round(minutes));
}

/** Prefix a root-relative path with the site base path. */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL;
  const prefix = base === "/" ? "" : base.replace(/\/$/, "");
  if (!path.startsWith("/")) return path;
  return prefix + path;
}

export function homeLabel(override?: string): string {
  if (override && override.trim()) return override.trim();
  const lang = (gitpress.site.language ?? "en").toLowerCase();
  if (lang.startsWith("zh")) return "首页";
  if (lang.startsWith("ja")) return "ホーム";
  return "Home";
}

export function mediaHref(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  return withBase(path.startsWith("/") ? path : `/${path}`);
}

export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

/** Explicit menu configured by the site owner, if any (see NavItem above). */
const configuredNav: NavItem[] | undefined = gitpress.site.nav;

/**
 * Resolves the top-nav links to render. When the site owner has configured
 * `site.nav`, that list is the only source of truth (order, visibility,
 * labels — including whether Home/RSS show up at all). When absent, this
 * falls back to Home, then nav categories, then every page. RSS lives in
 * the footer unless the owner explicitly adds it to `site.nav`. Either way,
 * "Archive" is always appended: it is a fixed feature of this theme (see
 * pages/archive), not a site-owner-configurable menu entry.
 */
export function buildNav(pages: Page[]): NavLink[] {
  const archive = { href: withBase("/archive/"), label: "Archive" };
  if (!configuredNav) {
    return [
      { href: withBase("/"), label: homeLabel() },
      ...navCategories.map((c) => ({ href: withBase(`/categories/${c.slug}/`), label: c.label })),
      ...pages
        .slice()
        .sort((a, b) => a.data.title.localeCompare(b.data.title))
        .map((p) => ({ href: withBase(`/${postSlug(p)}/`), label: p.data.title })),
      archive,
    ];
  }
  const links: NavLink[] = [];
  for (const item of configuredNav) {
    if (item.type === "home") {
      links.push({ href: withBase("/"), label: homeLabel(item.label) });
    } else if (item.type === "rss") {
      links.push({ href: withBase("/rss.xml"), label: item.label ?? "RSS" });
    } else if (item.type === "category" && item.slug) {
      links.push({
        href: withBase(`/categories/${item.slug}/`),
        label: item.label ?? categoryLabel(item.slug),
      });
    } else if (item.type === "page" && item.slug) {
      const page = pages.find((p) => postSlug(p) === item.slug);
      if (!page) continue; // page renamed/deleted since the menu was saved
      links.push({ href: withBase(`/${postSlug(page)}/`), label: item.label ?? page.data.title });
    } else if (item.type === "link" && item.url && item.label) {
      links.push({ href: item.url, label: item.label, external: true });
    }
  }
  links.push(archive);
  return links;
}
