import { mediaPreviewUrl } from "./mediaUrl";

export function isPostContentPath(path: string | null | undefined): path is string {
  return Boolean(path && path.startsWith("content/posts/") && !path.includes(".."));
}

export function postPreviewHref(siteId: string, path: string): string {
  return `/sites/${siteId}/posts/preview?path=${encodeURIComponent(path)}`;
}

export function postEditHref(siteId: string, path: string): string {
  return `/sites/${siteId}/posts/edit?path=${encodeURIComponent(path)}`;
}

export function isSitePostPreviewPath(pathname: string): boolean {
  return /^\/sites\/[^/]+\/posts\/preview\/?$/.test(pathname);
}

/** Public post URL. `site.url` already includes the Pages base path when needed. */
export function publicPostUrl(siteUrl: string | null | undefined, slug: string): string | null {
  if (!siteUrl?.trim() || !slug.trim()) return null;
  const segment = slug.trim().replace(/^\/+|\/+$/g, "");
  if (!segment || segment.includes("/") || segment.includes("..")) return null;
  return `${siteUrl.trim().replace(/\/+$/, "")}/posts/${segment}/`;
}

export function previewAssetSrc(siteId: string, path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  const value = path.trim();
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("/media/")) return mediaPreviewUrl(siteId, value.slice("/media/".length));
  if (value.startsWith("media/")) return mediaPreviewUrl(siteId, value.slice("media/".length));
  return null;
}
