import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getSiteBeian, getSiteCategories, getSiteConfig, getSiteFooter, getSiteNav, listMedia, listPages, listPosts } from "./content";
import { getActionsUsage, getInstallationOctokit } from "./github";

const REVALIDATE_SECONDS = 45;
/** Media files rarely change except via our own upload/delete, which already busts the tag. */
const MEDIA_REVALIDATE_SECONDS = 30 * 60;

export function siteDataTag(dataRepo: string): string {
  return `gitpress-data:${dataRepo}`;
}

export function revalidateSiteData(dataRepo: string, paths: string[] = []): void {
  revalidateTag(siteDataTag(dataRepo));
  for (const path of paths) revalidatePath(path);
}

export function cachedListPosts(installationId: number, dataRepo: string) {
  return unstable_cache(
    async () => listPosts(await getInstallationOctokit(installationId), dataRepo),
    ["list-posts", dataRepo],
    { revalidate: REVALIDATE_SECONDS, tags: [siteDataTag(dataRepo)] },
  )();
}

export function cachedListMedia(installationId: number, dataRepo: string) {
  return unstable_cache(
    async () => listMedia(await getInstallationOctokit(installationId), dataRepo),
    ["list-media-v2", dataRepo],
    { revalidate: MEDIA_REVALIDATE_SECONDS, tags: [siteDataTag(dataRepo)] },
  )();
}

export function cachedSiteConfig(installationId: number, dataRepo: string) {
  return unstable_cache(
    async () => getSiteConfig(await getInstallationOctokit(installationId), dataRepo),
    ["site-config", dataRepo],
    { revalidate: REVALIDATE_SECONDS, tags: [siteDataTag(dataRepo)] },
  )();
}

export function cachedSiteCategories(installationId: number, dataRepo: string) {
  return unstable_cache(
    async () => getSiteCategories(await getInstallationOctokit(installationId), dataRepo),
    ["site-categories", dataRepo],
    { revalidate: REVALIDATE_SECONDS, tags: [siteDataTag(dataRepo)] },
  )();
}

export function cachedSiteNav(installationId: number, dataRepo: string) {
  return unstable_cache(
    async () => getSiteNav(await getInstallationOctokit(installationId), dataRepo),
    ["site-nav", dataRepo],
    { revalidate: REVALIDATE_SECONDS, tags: [siteDataTag(dataRepo)] },
  )();
}

export function cachedSiteFooter(installationId: number, dataRepo: string) {
  return unstable_cache(
    async () => getSiteFooter(await getInstallationOctokit(installationId), dataRepo),
    ["site-footer", dataRepo],
    { revalidate: REVALIDATE_SECONDS, tags: [siteDataTag(dataRepo)] },
  )();
}

export function cachedSiteBeian(installationId: number, dataRepo: string) {
  return unstable_cache(
    async () => getSiteBeian(await getInstallationOctokit(installationId), dataRepo),
    ["site-beian", dataRepo],
    { revalidate: REVALIDATE_SECONDS, tags: [siteDataTag(dataRepo)] },
  )();
}

export function cachedListPages(installationId: number, dataRepo: string, language = "en") {
  return unstable_cache(
    async () => listPages(await getInstallationOctokit(installationId), dataRepo, language),
    ["list-pages", dataRepo, language],
    { revalidate: REVALIDATE_SECONDS, tags: [siteDataTag(dataRepo)] },
  )();
}

function userTokenCacheKey(token?: string | null): string {
  if (!token) return "0";
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function cachedActionsUsage(options: {
  installationId: number;
  dataRepo: string;
  accountLogin: string;
  accountType: string;
  userToken?: string | null;
}) {
  return unstable_cache(
    async () => {
      const octokit = await getInstallationOctokit(options.installationId);
      return getActionsUsage({
        octokit,
        dataRepo: options.dataRepo,
        accountLogin: options.accountLogin,
        accountType: options.accountType,
        userToken: options.userToken,
      });
    },
    ["actions-usage", options.dataRepo, options.accountLogin, userTokenCacheKey(options.userToken)],
    { revalidate: 60, tags: [siteDataTag(options.dataRepo)] },
  )();
}
