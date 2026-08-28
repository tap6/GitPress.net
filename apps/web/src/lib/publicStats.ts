import { count } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { githubInstallations, sites, users } from "@/db/schema";
import { BUILTIN_THEMES } from "@/lib/themes";

export interface PublicPlatformStats {
  /** Registered accounts (Auth.js users table). */
  users: number;
  /** Blogs/sites provisioned on the platform. */
  sites: number;
  /** GitHub App installations linked by users. */
  githubConnections: number;
  /** Built-in Astro themes available at site creation. */
  themes: number;
}

async function queryPublicStats(): Promise<PublicPlatformStats> {
  const [userRow] = await db.select({ value: count() }).from(users);
  const [siteRow] = await db.select({ value: count() }).from(sites);
  const [installRow] = await db.select({ value: count() }).from(githubInstallations);

  return {
    users: userRow?.value ?? 0,
    sites: siteRow?.value ?? 0,
    githubConnections: installRow?.value ?? 0,
    themes: BUILTIN_THEMES.length,
  };
}

/** Aggregate, non-identifying counters safe to show on the public landing page. */
export function getPublicPlatformStats(): Promise<PublicPlatformStats> {
  return unstable_cache(queryPublicStats, ["public-platform-stats"], {
    revalidate: 300,
  })();
}

export function formatStatCount(value: number): string {
  return value.toLocaleString("zh-CN");
}
