import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getSiteCategories, getSiteConfig, listMedia, listPosts } from "./content";
import { getActionsUsage, getInstallationOctokit } from "./github";

const REVALIDATE_SECONDS = 45;

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
    ["list-media", dataRepo],
    { revalidate: REVALIDATE_SECONDS, tags: [siteDataTag(dataRepo)] },
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
    ["actions-usage", options.dataRepo, options.accountLogin, options.userToken ? "1" : "0"],
    { revalidate: 60, tags: [siteDataTag(options.dataRepo)] },
  )();
}
