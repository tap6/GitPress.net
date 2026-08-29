/**
 * Site-owner footer. Stored on `gitpress.json` → `site.footer` / `site.beian`
 * (see @gitpress/spec — duplicated here so the platform has no runtime
 * dependency on the spec package).
 *
 * System slots default to on when `site.footer` is absent. Once saved, the
 * array is the only source of truth: omitting a slot hides it. Custom items
 * are only page / link / text.
 */

export type FooterItem =
  | { type: "copyright"; label?: string }
  | { type: "gitpress"; label?: string }
  | { type: "theme"; label?: string }
  | { type: "rss"; label?: string }
  | { type: "page"; slug: string; label?: string }
  | { type: "link"; url: string; label: string }
  | { type: "text"; label: string };

export const SYSTEM_FOOTER_TYPES = ["copyright", "gitpress", "theme", "rss"] as const;
export type SystemFooterType = (typeof SYSTEM_FOOTER_TYPES)[number];

export function isSystemFooterType(type: string): type is SystemFooterType {
  return (SYSTEM_FOOTER_TYPES as readonly string[]).includes(type);
}

export function defaultFooterItems(): FooterItem[] {
  return [{ type: "copyright" }, { type: "gitpress" }, { type: "theme" }, { type: "rss" }];
}

export function persistFooterItem(item: FooterItem): FooterItem {
  const label = "label" in item ? item.label?.trim() : undefined;
  switch (item.type) {
    case "copyright":
      return label ? { type: "copyright", label } : { type: "copyright" };
    case "gitpress":
      return label ? { type: "gitpress", label } : { type: "gitpress" };
    case "theme":
      return label ? { type: "theme", label } : { type: "theme" };
    case "rss":
      return label ? { type: "rss", label } : { type: "rss" };
    case "page":
      return label ? { type: "page", slug: item.slug, label } : { type: "page", slug: item.slug };
    case "link":
      return { type: "link", url: item.url, label: item.label.trim() };
    case "text":
      return { type: "text", label: item.label.trim() };
  }
}

export function parseFooterItem(raw: unknown): FooterItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const type = typeof item.type === "string" ? item.type : "";
  const label = typeof item.label === "string" ? item.label.trim() : "";
  switch (type) {
    case "copyright":
    case "gitpress":
    case "theme":
    case "rss":
      return persistFooterItem({ type, label: label || undefined });
    case "page": {
      const slug = typeof item.slug === "string" ? item.slug.trim() : "";
      if (!slug) return null;
      return persistFooterItem({ type: "page", slug, label: label || undefined });
    }
    case "link": {
      const url = typeof item.url === "string" ? item.url.trim() : "";
      if (!url || !label) return null;
      return persistFooterItem({ type: "link", url, label });
    }
    case "text":
      if (!label) return null;
      return persistFooterItem({ type: "text", label });
    default:
      if (typeof item.url === "string" && item.url.trim() && label) {
        return persistFooterItem({ type: "link", url: item.url.trim(), label });
      }
      if (label) return persistFooterItem({ type: "text", label });
      return null;
  }
}

export interface SiteBeian {
  icp?: string;
  gongan?: string;
}

/** Keep digits only so pasted 「京公网安备 1100…号」 still works. */
export function gonganRecordCode(value: string): string {
  return value.replace(/\D/g, "");
}

export function persistBeian(raw: unknown): SiteBeian | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const item = raw as Record<string, unknown>;
  const icp = typeof item.icp === "string" ? item.icp.trim() : "";
  const gonganRaw = typeof item.gongan === "string" ? item.gongan.trim() : "";
  const gongan = gonganRecordCode(gonganRaw);
  if (!icp && !gongan) return undefined;
  const next: SiteBeian = {};
  if (icp) next.icp = icp;
  if (gongan) next.gongan = gongan;
  return next;
}

export function defaultCopyrightPlaceholder(title: string): string {
  return `© {year} ${title}`;
}
