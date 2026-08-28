import { count, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { githubInstallations, sites, themeListings, users } from "@/db/schema";
import { BUILTIN_THEMES } from "@/lib/themes";

export const PUBLIC_STATS_TAG = "public-platform-stats";

export interface PublicPlatformStats {
  /** Registered accounts (Auth.js users table). */
  users: number;
  /** Blogs/sites provisioned on the platform. */
  sites: number;
  /** GitHub App installations linked by users. */
  githubConnections: number;
  /** Built-in themes plus listed catalog entries (not hidden/pending). */
  themes: number;
}

async function queryPublicStats(): Promise<PublicPlatformStats> {
  const [userRow] = await db.select({ value: count() }).from(users);
  const [siteRow] = await db.select({ value: count() }).from(sites);
  const [installRow] = await db.select({ value: count() }).from(githubInstallations);
  const [listedRow] = await db
    .select({ value: count() })
    .from(themeListings)
    .where(eq(themeListings.status, "listed"));

  return {
    users: userRow?.value ?? 0,
    sites: siteRow?.value ?? 0,
    githubConnections: installRow?.value ?? 0,
    themes: BUILTIN_THEMES.length + (listedRow?.value ?? 0),
  };
}

/** Aggregate, non-identifying counters safe to show on the public landing page. */
export function getPublicPlatformStats(): Promise<PublicPlatformStats> {
  return unstable_cache(queryPublicStats, [PUBLIC_STATS_TAG], {
    revalidate: 300,
    tags: [PUBLIC_STATS_TAG],
  })();
}

export function formatStatCount(value: number): string {
  return value.toLocaleString("zh-CN");
}
