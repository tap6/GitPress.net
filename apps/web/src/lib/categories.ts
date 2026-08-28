/** Site-owner-maintained category. Stored on `gitpress.json` → `site.categories`. */
export interface SiteCategory {
  slug: string;
  label: string;
  /** When false, omit from the generated site's top nav. Missing means true. */
  inNav?: boolean;
}

/** Top-nav visibility. Absent `inNav` is treated as true so existing sites keep their menus. */
export function isCategoryInNav(category: Pick<SiteCategory, "inNav">): boolean {
  return category.inNav !== false;
}

/**
 * Write `inNav` only when it is off. Missing means true, so persisting `true`
 * would rewrite every existing category on the first save after this field
 * shipped — a noisy commit and a wasted Actions run.
 */
export function persistSiteCategory(category: SiteCategory): SiteCategory {
  const persisted: SiteCategory = { slug: category.slug, label: category.label };
  if (category.inNav === false) persisted.inNav = false;
  return persisted;
}
