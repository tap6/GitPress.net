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

type FooterItem =
  | { type: "copyright"; label?: string }
  | { type: "gitpress"; label?: string }
  | { type: "theme"; label?: string }
  | { type: "rss"; label?: string }
  | { type: "page"; slug: string; label?: string }
  | { type: "link"; url: string; label: string }
  | { type: "text"; label: string }
  | { type: string; label?: string; url?: string; slug?: string };

interface SiteInfo {
  title: string;
  description?: string;
  language?: string;
  url?: string;
  basePath?: string;
  author?: string;
  analyticsSnippet?: string;
  comments?: {
    enabled?: boolean;
    giscus?: {
      repo: string;
      repoId: string;
      category: string;
      categoryId: string;
      mapping?: string;
      lang?: string;
    };
  };
  commentsSnippet?: string;
  logo?: string;
  avatar?: string;
  categories?: SiteCategory[];
  postsPerPage?: number;
  nav?: NavItem[];
  footer?: FooterItem[];
  beian?: { icp?: string; gongan?: string };
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

function loadThemeManifest(): { displayName?: string; name?: string; homepage?: string } {
  const path = new URL("../../theme.json", import.meta.url);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as {
      displayName?: string;
      name?: string;
      homepage?: string;
    };
  } catch {
    return {};
  }
}

const themeManifest = loadThemeManifest();

/** Theme option defaults — absent options always fall back so old sites keep building. */
export const themeConfig = {
  accentColor: "#5b5bd6",
  showReadingTime: true,
  defaultAppearance: "system",
  showLogo: true,
  showAvatar: false,
  showTitle: true,
  showTagline: true,
  showSearch: true,
  showListTime: false,
  showPostTime: true,
  ...(gitpress.theme?.config ?? {}),
} as {
  accentColor: string;
  showReadingTime: boolean;
  defaultAppearance: "system" | "light" | "dark";
  showLogo: boolean;
  showAvatar: boolean;
  showTitle: boolean;
  showTagline: boolean;
  showSearch: boolean;
  showListTime: boolean;
  showPostTime: boolean;
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
  const now = Date.now();
  const posts = await getCollection("posts");
  return posts
    .filter((p) => {
      if (includeDrafts) return true;
      if (p.data.draft === true || p.data.date == null) return false;
      return p.data.date.getTime() <= now;
    })
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

export function formatDate(date: Date | undefined, withTime = false): string {
  if (!date) return "";
  return new Intl.DateTimeFormat(gitpress.site.language ?? "en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime
      ? { hour: "2-digit" as const, minute: "2-digit" as const, second: "2-digit" as const, hour12: false }
      : {}),
  }).format(date);
}

export function formatListDate(date: Date | undefined): string {
  return formatDate(date, themeConfig.showListTime === true);
}

export function formatPostDate(date: Date | undefined): string {
  return formatDate(date, themeConfig.showPostTime !== false);
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

export function commentsEnabled(): boolean {
  const { comments, commentsSnippet } = gitpress.site;
  if (comments?.enabled !== undefined) return comments.enabled;
  return Boolean(comments?.giscus || commentsSnippet);
}

export function giscusEmbed(): {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  lang: string;
  theme: string;
} | undefined {
  const giscus = gitpress.site.comments?.giscus;
  if (!giscus?.repo || !giscus.repoId || !giscus.category || !giscus.categoryId) return undefined;
  return {
    repo: giscus.repo,
    repoId: giscus.repoId,
    category: giscus.category,
    categoryId: giscus.categoryId,
    lang: giscus.lang || "en",
    theme: "light",
  };
}

export function searchLabel(override?: string): string {
  if (override && override.trim()) return override.trim();
  const lang = (gitpress.site.language ?? "en").toLowerCase();
  if (lang.startsWith("zh")) return "搜索";
  if (lang.startsWith("ja")) return "検索";
  return "Search";
}

function siteOrigin(): string | undefined {
  const raw = gitpress.site.url?.trim();
  if (!raw) return undefined;
  return raw.endsWith("/") ? raw : `${raw}/`;
}

/** Absolute canonical URL for the current page path (already includes base). */
export function pageCanonicalUrl(pathname: string): string | undefined {
  const origin = siteOrigin();
  if (!origin) return undefined;
  try {
    return new URL(pathname, origin).href;
  } catch {
    return undefined;
  }
}

/** Turn a site-relative or /media path into an absolute URL when site.url is set. */
export function pageAbsoluteUrl(path?: string): string | undefined {
  if (!path) return undefined;
  const href = mediaHref(path);
  if (!href) return undefined;
  if (/^https?:\/\//i.test(href) || href.startsWith("data:")) return href;
  const origin = siteOrigin();
  if (!origin) return href;
  try {
    return new URL(href, origin).href;
  } catch {
    return href;
  }
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
function withOptionalSearch(links: NavLink[]): NavLink[] {
  if (themeConfig.showSearch !== false) {
    links.push({ href: withBase("/search/"), label: searchLabel() });
  }
  return links;
}

export function buildNav(pages: Page[]): NavLink[] {
  const archive = { href: withBase("/archive/"), label: "Archive" };
  if (!configuredNav) {
    return withOptionalSearch([
      { href: withBase("/"), label: homeLabel() },
      ...navCategories.map((c) => ({ href: withBase(`/categories/${c.slug}/`), label: c.label })),
      ...pages
        .slice()
        .sort((a, b) => a.data.title.localeCompare(b.data.title))
        .map((p) => ({ href: withBase(`/${postSlug(p)}/`), label: p.data.title })),
      archive,
    ]);
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
  return withOptionalSearch(links);
}

export interface FooterEntry {
  label: string;
  href?: string;
  external?: boolean;
  rel?: string;
  icon?: "gongan";
}

function withYear(label: string): string {
  return label.replace(/\{year\}/g, String(new Date().getFullYear()));
}

function gitpressCreditLabel(override?: string): string {
  if (override?.trim()) return override.trim();
  const lang = (gitpress.site.language ?? "en").toLowerCase();
  if (lang.startsWith("zh")) return "由 GitPress 驱动";
  if (lang.startsWith("ja")) return "GitPress で構築";
  return "Powered by GitPress";
}

function themeCreditLabel(override?: string): string | null {
  const homepage = themeManifest.homepage?.trim();
  if (!homepage) return null;
  if (override?.trim()) return override.trim();
  const name = themeManifest.displayName || themeManifest.name || "theme";
  const lang = (gitpress.site.language ?? "en").toLowerCase();
  if (lang.startsWith("zh")) return `主题 ${name}`;
  if (lang.startsWith("ja")) return `テーマ ${name}`;
  return `Theme: ${name}`;
}

function resolveFooterItem(item: FooterItem, pages: Page[]): FooterEntry | null {
  if (item.type === "copyright") {
    const custom = item.label?.trim();
    return { label: custom ? withYear(custom) : `© ${new Date().getFullYear()} ${gitpress.site.title}` };
  }
  if (item.type === "gitpress") {
    return {
      label: gitpressCreditLabel(item.label),
      href: "https://gitpress.net",
      external: true,
      rel: "generator",
    };
  }
  if (item.type === "theme") {
    const label = themeCreditLabel(item.label);
    const homepage = themeManifest.homepage?.trim();
    if (!label || !homepage) return null;
    return { label, href: homepage, external: true, rel: "noopener noreferrer" };
  }
  if (item.type === "rss") {
    return { label: item.label?.trim() || "RSS", href: withBase("/rss.xml") };
  }
  if (item.type === "page" && item.slug) {
    const page = pages.find((p) => postSlug(p) === item.slug);
    if (!page) return null;
    return { href: withBase(`/${postSlug(page)}/`), label: item.label?.trim() || page.data.title };
  }
  if (item.type === "link" && item.url && item.label) {
    return { href: item.url, label: item.label, external: true, rel: "noopener noreferrer" };
  }
  if (item.type === "text" && item.label?.trim()) {
    return { label: withYear(item.label.trim()) };
  }
  if (item.url && item.label) {
    return { href: item.url, label: item.label, external: true, rel: "noopener noreferrer" };
  }
  if (item.label?.trim()) return { label: withYear(item.label.trim()) };
  return null;
}

function beianEntries(): FooterEntry[] {
  const entries: FooterEntry[] = [];
  const icp = gitpress.site.beian?.icp?.trim();
  if (icp) {
    entries.push({
      label: icp,
      href: "https://beian.miit.gov.cn/",
      external: true,
      rel: "noopener noreferrer",
    });
  }
  const gongan = (gitpress.site.beian?.gongan ?? "").replace(/\D/g, "");
  if (gongan) {
    entries.push({
      label: `公网安备 ${gongan}号`,
      href: `https://beian.mps.gov.cn/#/query/webSearch?recordcode=${gongan}`,
      external: true,
      rel: "noopener noreferrer",
      icon: "gongan",
    });
  }
  return entries;
}

/** Default slots when `site.footer` is absent. RSS/GitPress/theme/copyright are all hideable once saved. */
export function buildFooter(pages: Page[]): FooterEntry[] {
  const slots: FooterItem[] = gitpress.site.footer ?? [
    { type: "copyright" },
    { type: "gitpress" },
    ...(themeManifest.homepage ? [{ type: "theme" as const }] : []),
    { type: "rss" },
  ];
  const entries: FooterEntry[] = [];
  for (const item of slots) {
    const entry = resolveFooterItem(item, pages);
    if (entry) entries.push(entry);
  }
  entries.push(...beianEntries());
  return entries;
}
