"use client";

/**
 * Cache Storage for admin media thumbnails. Authenticated route handlers are
 * often sent with `Cache-Control: no-store`, so HTTP cache alone is unreliable.
 * Entries are keyed by the preview URL (which includes the git blob sha).
 */

const CACHE_NAME = "gitpress-media-v1";

function absoluteUrl(url: string): string {
  return new URL(url, window.location.origin).href;
}

export async function matchMediaCache(url: string): Promise<Blob | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(absoluteUrl(url));
    if (!response?.ok) return null;
    return await response.blob();
  } catch {
    return null;
  }
}

export async function putMediaCache(url: string, blob: Blob): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(
      absoluteUrl(url),
      new Response(blob, {
        headers: {
          "Content-Type": blob.type || "application/octet-stream",
          "Cache-Control": "private, max-age=31536000, immutable",
        },
      }),
    );
  } catch {
    // Quota / private mode — skip; next visit will refetch.
  }
}

/** Drop cached thumbs for this site that are no longer in the library. */
export async function pruneMediaCache(siteId: string, keepUrls: string[]): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keep = new Set(keepUrls.map(absoluteUrl));
    const prefix = absoluteUrl(`/api/sites/${siteId}/media/`);
    const keys = await cache.keys();
    await Promise.all(
      keys.map((request) => {
        if (!request.url.startsWith(prefix) || keep.has(request.url)) return Promise.resolve(false);
        return cache.delete(request);
      }),
    );
  } catch {
    // ignore
  }
}
