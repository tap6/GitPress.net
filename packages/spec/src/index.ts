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

/**
 * One entry in the site owner's footer (`site.footer`).
 *
 * System slots (`copyright`, `gitpress`, `theme`, `rss`) are defined by the
 * platform and default to visible when `site.footer` is absent. Owners may
 * hide any of them (omit from the array) or override `label`. Custom chrome
 * is only `page` / `link` / `text` — do not add more custom types; unknown
 * types should render as a link (url+label) or plain text (label only).
 *
 * `theme` has no URL in gitpress.json: themes resolve it from their own
 * theme.json (`homepage`, `displayName`) at build time so a theme switch
 * does not leave a stale credit.
 */
export type FooterItem =
  | { type: "copyright"; label?: string }
  | { type: "gitpress"; label?: string }
  | { type: "theme"; label?: string }
  | { type: "rss"; label?: string }
  | { type: "page"; slug: string; label?: string }
  | { type: "link"; url: string; label: string }
  | { type: "text"; label: string };

/** Mainland China ICP / 公安备案. Shown at the end of the footer when set. */
export interface SiteBeian {
  /** 工信部备案号, e.g. 京ICP备12345678号. Linked to https://beian.miit.gov.cn/ */
  icp?: string;
  /** 公安备案号 (digits / recordcode). Linked to the MPS query page. */
  gongan?: string;
}

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
   * Public path to the site logo (typically `/media/logo-….png`). Themes
   * honour `theme.config.showLogo` (default true) when deciding whether to
   * render it. Survives theme switches — it lives on `site`, not `theme.config`.
   */
  logo?: string;
  /**
   * Public path to a circular author/site avatar (typically `/media/avatar-….png`).
   * Themes honour `theme.config.showAvatar` (default false).
   */
  avatar?: string;
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
   * opened the menu editor yet), themes fall back to their own implicit nav
   * (typically Home + inNav categories + pages). RSS belongs in the footer
   * by default; it is only in the header if the owner explicitly adds it
   * here. Default nav item labels should follow `site.language` (e.g. "首页"
   * / "Home") so non-English owners are not stuck with English chrome.
   */
  nav?: NavItem[];
  /**
   * Explicit, ordered footer. When present, themes render exactly these
   * items (plus `beian` at the end). When absent, themes use the default
   * slots: copyright (site title, not GitHub login), GitPress credit,
   * theme credit (if theme.json has homepage), and RSS. Every slot is
   * optional once the owner has saved a footer. `{year}` in labels is
   * replaced at build time.
   */
  footer?: FooterItem[];
  /**
   * Optional ICP / 公安备案. Not part of the reorderable footer list:
   * if set, themes always append it after footer items. Empty/absent
   * means nothing is shown (typical for sites outside mainland China).
   */
  beian?: SiteBeian;
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
  /**
   * Public page or git repository for this theme. Footer `theme` slot
   * links here; omit it and themes skip the credit even if the slot is on.
   */
  homepage?: string;
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
  /** ISO 8601 local wall time, e.g. `2026-08-30T14:05:00`. Date-only is still accepted. Missing date = treated as draft by builders. */
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
