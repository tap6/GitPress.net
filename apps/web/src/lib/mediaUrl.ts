/** Same-origin preview URL for a data-repo image. `sha` makes the URL immutable. */
export function mediaPreviewUrl(siteId: string, fileName: string, sha?: string): string {
  const path = fileName.split("/").map(encodeURIComponent).join("/");
  const base = `/api/sites/${siteId}/media/${path}`;
  return sha ? `${base}?v=${encodeURIComponent(sha)}` : base;
}
