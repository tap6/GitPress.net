import { isCategoryInNav, persistSiteCategory, type SiteCategory } from "./categories";
import { defaultFooterItems, parseFooterItem, type FooterItem } from "./footer";
import { defaultGitpressLabel, defaultHomeLabel } from "./locale";
import { persistNavItem, type NavItem } from "./nav";
import { parsePostDate } from "./postDate";
import type { SiteConfig, SitePage } from "./content";

export interface PreviewNavLink {
  label: string;
  href?: string;
}

export interface PreviewFooterLink {
  label: string;
  href?: string;
  external?: boolean;
}

export interface PostPreviewChrome {
  title: string;
  description: string;
  language: string;
  logo: string | null;
  avatar: string | null;
  nav: PreviewNavLink[];
  footer: PreviewFooterLink[];
  categoryLabel: (slug: string | null) => string | null;
}

function asNavItems(raw: unknown): NavItem[] | null {
  if (!Array.isArray(raw)) return null;
  const items: NavItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || typeof (item as { type?: unknown }).type !== "string") continue;
    const candidate = item as NavItem;
    if (candidate.type === "link" && (!candidate.url || !candidate.label)) continue;
    items.push(persistNavItem(candidate));
  }
  return items;
}

function asFooterItems(raw: unknown): FooterItem[] | null {
  if (!Array.isArray(raw)) return null;
  return raw
    .map((item) => parseFooterItem(item))
    .filter((item): item is FooterItem => item !== null);
}

function asCategories(raw: unknown): SiteCategory[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is SiteCategory =>
        !!item &&
        typeof item === "object" &&
        typeof (item as SiteCategory).slug === "string" &&
        typeof (item as SiteCategory).label === "string",
    )
    .map((item) => persistSiteCategory(item));
}

function pageBySlug(pages: SitePage[], slug: string): SitePage | undefined {
  return pages.find((page) => page.slug === slug);
}

function buildNav(
  nav: NavItem[] | null,
  pages: SitePage[],
  categories: SiteCategory[],
  language: string,
): PreviewNavLink[] {
  if (!nav) {
    return [
      { label: defaultHomeLabel(language) },
      ...categories.filter(isCategoryInNav).map((category) => ({ label: category.label })),
      ...pages.map((page) => ({ label: page.title })),
    ];
  }

  const links: PreviewNavLink[] = [];
  const categoryLabel = new Map(categories.map((category) => [category.slug, category.label]));
  for (const item of nav) {
    if (item.type === "home") {
      links.push({ label: item.label?.trim() || defaultHomeLabel(language) });
    } else if (item.type === "rss") {
      links.push({ label: item.label?.trim() || "RSS" });
    } else if (item.type === "category" && item.slug) {
      links.push({ label: item.label?.trim() || categoryLabel.get(item.slug) || item.slug });
    } else if (item.type === "page" && item.slug) {
      const page = pageBySlug(pages, item.slug);
      if (!page) continue;
      links.push({ label: item.label?.trim() || page.title });
    } else if (item.type === "link" && item.url && item.label) {
      links.push({ label: item.label, href: item.url });
    }
  }
  return links;
}

function withYear(label: string): string {
  return label.replace(/\{year\}/g, String(new Date().getFullYear()));
}

function buildFooter(
  footer: FooterItem[] | null,
  pages: SitePage[],
  siteTitle: string,
  language: string,
): PreviewFooterLink[] {
  const items = footer ?? defaultFooterItems();
  const links: PreviewFooterLink[] = [];
  for (const item of items) {
    if (item.type === "copyright") {
      const custom = item.label?.trim();
      links.push({ label: custom ? withYear(custom) : `© ${new Date().getFullYear()} ${siteTitle}` });
    } else if (item.type === "gitpress") {
      links.push({
        label: item.label?.trim() || defaultGitpressLabel(language),
        href: "https://gitpress.net",
        external: true,
      });
    } else if (item.type === "theme") {
      continue;
    } else if (item.type === "rss") {
      links.push({ label: item.label?.trim() || "RSS" });
    } else if (item.type === "page" && item.slug) {
      const page = pageBySlug(pages, item.slug);
      if (!page) continue;
      links.push({ label: item.label?.trim() || page.title });
    } else if (item.type === "link" && item.url && item.label) {
      links.push({ label: item.label, href: item.url, external: true });
    } else if (item.type === "text" && item.label) {
      links.push({ label: item.label });
    }
  }
  return links;
}

export function buildPostPreviewChrome(
  config: SiteConfig | null,
  pages: SitePage[],
  fallback: { title: string; language: string },
): PostPreviewChrome {
  const site = config?.site ?? {};
  const title =
    typeof site.title === "string" && site.title.trim() ? site.title.trim() : fallback.title;
  const language =
    typeof site.language === "string" && site.language.trim() ? site.language.trim() : fallback.language;
  const description = typeof site.description === "string" ? site.description : "";
  const logo = typeof site.logo === "string" ? site.logo : null;
  const avatar = typeof site.avatar === "string" ? site.avatar : null;
  const categories = asCategories(site.categories);
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.label]));

  return {
    title,
    description,
    language,
    logo,
    avatar,
    nav: buildNav(asNavItems(site.nav), pages, categories, language),
    footer: buildFooter(asFooterItems(site.footer), pages, title, language),
    categoryLabel: (slug) => (slug ? categoryBySlug.get(slug) ?? slug : null),
  };
}

/** Site-language date for the reading view; uses the stored wall-clock date, not the server TZ. */
export function formatPreviewDate(date: string | null | undefined, language: string): string {
  const normalized = parsePostDate(date);
  if (!normalized) return "";
  const ymd = normalized.slice(0, 10);
  const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return ymd;
  const value = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  try {
    return value.toLocaleDateString(language, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return ymd;
  }
}
