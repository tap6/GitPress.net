/**
 * GitPress spec v1 — shared types for gitpress.json, theme.json and content frontmatter.
 *
 * Compatibility contract:
 * - schemaVersion / specVersion are bumped ONLY for breaking changes.
 * - New fields are always additive and optional; consumers must ignore unknown fields.
 * - Builders must refuse (not guess at) versions they do not understand.
 */

export const GITPRESS_SCHEMA_VERSION = 1 as const;
export const THEME_SPEC_VERSION = 1 as const;

/** Directory layout of a data repository, relative to its root. */
export const DATA_REPO_LAYOUT = {
  config: "gitpress.json",
  posts: "content/posts",
  pages: "content/pages",
  media: "media",
  workflow: ".github/workflows/gitpress-build.yml",
} as const;

/** Where the build action places data-repo files inside the theme project. */
export const THEME_MOUNT_POINTS = {
  /** gitpress.json is copied here so the theme can read it at build time. */
  config: "gitpress.config.json",
  /** content/ is copied here (posts/, pages/). */
  content: "user-content",
  /** media/ is copied here so images resolve at /media/... */
  media: "public/media",
} as const;

/** An ordered, site-owner-maintained top-level navigation/archive category. */
export interface SiteCategory {
  /** URL-safe identifier, e.g. "tech". Unique within `site.categories`. */
  slug: string;
  /** Display label, e.g. "Tech". */
  label: string;
  /**
   * When false, themes omit this category from the top navigation.
   * Archive pages (`/categories/<slug>/`) and post assignment are unaffected.
   * Missing or true means the category appears in the nav. Default true.
   */
  inNav?: boolean;
}

/** Top-nav visibility. Absent `inNav` is treated as true so existing sites keep their current menus. */
export function isCategoryInNav(category: Pick<SiteCategory, "inNav">): boolean {
  return category.inNav !== false;
}

/**
 * One entry in the site owner's explicit top-nav menu (`site.nav`).
 * `label` always overrides the item's natural name (category label / page
 * title); when absent, themes derive a sensible default.
 */
export type NavItem =
  | { type: "home"; label?: string }
  | { type: "rss"; label?: string }
  | { type: "category"; slug: string; label?: string }
  | { type: "page"; slug: string; label?: string }
  | { type: "link"; url: string; label: string };

export interface SiteInfo {
  title: string;
  description?: string;
  /** BCP-47 tag, e.g. "en", "zh-CN". */
  language?: string;
  /** Canonical URL, e.g. https://alice.github.io/my-blog */
  url?: string;
  /** Path prefix (GitHub Pages project sites use "/<repo>/"). */
  basePath?: string;
  author?: string;
  timezone?: string;
  /**
   * Ordered list of categories maintained by the site owner. Themes render
   * `/categories/<slug>/` archive pages for every entry, and top nav links
   * for those with `inNav !== false`. Distinct from the free-form `tags` on
   * individual posts — every post picks at most one category from this list
   * (stored as `categories: [slug]` in its frontmatter), while tags remain
   * unrestricted.
   */
  categories?: SiteCategory[];
  /** Posts per page for the homepage and category archives. Default 10. */
  postsPerPage?: number;
  /**
   * Raw HTML/script snippet (e.g. from GA4, Umami, Plausible, Clarity) that
   * themes insert verbatim before `</head>` on every page. Empty/absent means
   * no analytics are injected.
   */
  analyticsSnippet?: string;
  /**
   * Explicit, ordered top-nav menu maintained by the site owner: which items
   * appear (including whether "Home" or "RSS" show up at all), in what
   * order, and under what label. This is the *only* source of truth for the
   * generated site's navigation when present — themes must render exactly
   * these items, nothing more or less.
   *
   * When absent (sites created before this field existed, or that have not
   * opened the menu editor yet), themes fall back to their own legacy
   * implicit nav so existing sites keep their current menu unchanged after a
   * spec/theme upgrade. This exists specifically so site owners — not theme
   * authors — decide what belongs in the header, instead of every category
   * and page being unconditionally forced into one unbounded row.
   */
  nav?: NavItem[];
}

export interface ThemeRef {
  /** Theme identifier, e.g. "classic". */
  name: string;
  /**
   * "builtin" | "github:<owner>/<repo>[/<subdir>]#<ref>" | "npm:<pkg>@<version>"
   */
  source: string;
  /** Pinned tag/commit/version. Builders must never float to latest implicitly. */
  ref?: string;
  /** Theme options validated against the theme's configSchema. */
  config?: Record<string, unknown>;
}

export interface BuildOptions {
  /** Safety valve for previews only; public builds keep this false. */
  includeDrafts?: boolean;
  /** Build output dir inside the theme project. Default "dist". */
  output?: string;
}

export interface GitPressConfig {
  schemaVersion: typeof GITPRESS_SCHEMA_VERSION;
  site: SiteInfo;
  theme: ThemeRef;
  build?: BuildOptions;
  /** Reserved for the plugin system; v1 builders ignore entries without failing. */
  plugins?: Array<Record<string, unknown>>;
}

export interface ThemeManifest {
  specVersion: typeof THEME_SPEC_VERSION;
  name: string;
  /** Semver of the theme itself. */
  version: string;
  displayName?: string;
  description?: string;
  author?: string;
  license?: string;
  /** Spec v1 defines only "astro". */
  engine: "astro";
  /** Relative path to a preview image inside the theme package. */
  preview?: string;
  tags?: string[];
  /** JSON Schema for theme.config; themes must default absent options. */
  configSchema?: Record<string, unknown>;
}

/**
 * Frontmatter for content/posts/*.md and content/pages/*.md.
 * Unknown keys are preserved and passed through to themes.
 */
export interface PostFrontmatter {
  title: string;
  /** ISO 8601. Missing date = treated as draft by builders. */
  date?: string;
  updated?: string;
  /** Drafts are excluded from public builds and never leave the private data repo. */
  draft?: boolean;
  tags?: string[];
  categories?: string[];
  description?: string;
  /** Path under /media, e.g. "/media/2026/cover.jpg". */
  cover?: string;
  /** Overrides the filename-derived slug. */
  slug?: string;
  [key: string]: unknown;
}

/** Minimal structural validation (full validation uses the JSON Schemas). */
export function assertGitPressConfig(value: unknown): GitPressConfig {
  if (typeof value !== "object" || value === null) {
    throw new Error("gitpress.json: expected an object");
  }
  const cfg = value as Record<string, unknown>;
  if (cfg.schemaVersion !== GITPRESS_SCHEMA_VERSION) {
    throw new Error(
      `gitpress.json: unsupported schemaVersion ${String(cfg.schemaVersion)} (this builder understands ${GITPRESS_SCHEMA_VERSION}). ` +
        "Refusing to build rather than risk corrupting the site.",
    );
  }
  const site = cfg.site as SiteInfo | undefined;
  if (!site || typeof site.title !== "string" || site.title.length === 0) {
    throw new Error("gitpress.json: site.title is required");
  }
  const theme = cfg.theme as ThemeRef | undefined;
  if (!theme || typeof theme.name !== "string" || typeof theme.source !== "string") {
    throw new Error("gitpress.json: theme.name and theme.source are required");
  }
  return cfg as unknown as GitPressConfig;
}
