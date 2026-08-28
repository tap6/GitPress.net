/**
 * Explicit top-nav menu maintained by the site owner. Stored on
 * `gitpress.json` → `site.nav` (see @gitpress/spec's NavItem — duplicated
 * here, same pattern as SiteCategory in ./categories, so the platform has no
 * runtime dependency on the spec package).
 *
 * When `site.nav` is present, it is the *only* source of truth for the
 * generated site's navigation (order, visibility, labels — including
 * whether Home/RSS appear at all). When absent, themes fall back to their
 * own legacy implicit nav, so sites that have never opened this menu editor
 * keep their current header unchanged.
 */
export type NavItem =
  | { type: "home"; label?: string }
  | { type: "rss"; label?: string }
  | { type: "category"; slug: string; label?: string }
  | { type: "page"; slug: string; label?: string }
  | { type: "link"; url: string; label: string };

/** Strips empty label overrides so persisted JSON stays minimal and diff-friendly. */
export function persistNavItem(item: NavItem): NavItem {
  const label = "label" in item ? item.label?.trim() : undefined;
  switch (item.type) {
    case "home":
      return label ? { type: "home", label } : { type: "home" };
    case "rss":
      return label ? { type: "rss", label } : { type: "rss" };
    case "category":
      return label ? { type: "category", slug: item.slug, label } : { type: "category", slug: item.slug };
    case "page":
      return label ? { type: "page", slug: item.slug, label } : { type: "page", slug: item.slug };
    case "link":
      return { type: "link", url: item.url, label: item.label.trim() };
  }
}
