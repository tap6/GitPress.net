/** Public origin. `AUTH_URL` in production is https://gitpress.net. */
export const SITE_URL = process.env.AUTH_URL?.replace(/\/$/, "") || "https://gitpress.net";

export const BRAND_LOGO = "/brand/logo.png";

/** 1200×630 crop of the admin screenshot — for Search / Discover / social, not the wordmark lockup. */
export function shareImagePath(locale: string): "/landing/share-en.png" | "/landing/share-zh.png" {
  return locale === "en" ? "/landing/share-en.png" : "/landing/share-zh.png";
}

export function dashboardImagePath(locale: string): "/landing/dashboard-en.webp" | "/landing/dashboard-zh.webp" {
  return locale === "en" ? "/landing/dashboard-en.webp" : "/landing/dashboard-zh.webp";
}

export function absoluteAsset(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
