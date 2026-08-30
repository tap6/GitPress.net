import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { siteThemeLibrary, themeListings } from "@/db/schema";
import {
  fetchGithubThemeManifest,
  themeCardCacheFromManifest,
  type RemoteThemeManifest,
} from "./themeSource";

export const SITE_THEME_LIBRARY_LIMIT = 20;

export type SiteThemeLibraryRow = typeof siteThemeLibrary.$inferSelect;

export async function listSiteThemeLibrary(siteId: string): Promise<SiteThemeLibraryRow[]> {
  return db
    .select()
    .from(siteThemeLibrary)
    .where(eq(siteThemeLibrary.siteId, siteId))
    .orderBy(asc(siteThemeLibrary.createdAt));
}

export async function siteThemeLibraryCount(siteId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(siteThemeLibrary)
    .where(eq(siteThemeLibrary.siteId, siteId));
  return row?.value ?? 0;
}

export async function findListedThemeSource(source: string) {
  const [row] = await db
    .select()
    .from(themeListings)
    .where(and(eq(themeListings.source, source), eq(themeListings.status, "listed")))
    .limit(1);
  return row ?? null;
}

/**
 * If the site is already on a GitHub theme that is neither catalogued nor in
 * the shelf (legacy "import and enable"), add it so it does not disappear.
 */
export async function ensureLegacyImportedThemeOnShelf(input: {
  siteId: string;
  themeSource: string;
  manifest: (RemoteThemeManifest & { name: string }) | null;
}): Promise<void> {
  const source = input.themeSource;
  if (!source.startsWith("github:")) return;
  if (await findListedThemeSource(source)) return;

  const [existing] = await db
    .select({ id: siteThemeLibrary.id })
    .from(siteThemeLibrary)
    .where(and(eq(siteThemeLibrary.siteId, input.siteId), eq(siteThemeLibrary.source, source)))
    .limit(1);
  if (existing) return;

  let manifest = input.manifest;
  if (!manifest?.name) {
    const fetched = await fetchGithubThemeManifest(source);
    if (!fetched?.name) return;
    manifest = fetched as RemoteThemeManifest & { name: string };
  }

  const cache = themeCardCacheFromManifest(source, manifest);
  try {
    await db.insert(siteThemeLibrary).values({
      siteId: input.siteId,
      source,
      ...cache,
    });
  } catch {
    /* unique race or other constraint — the shelf page still renders */
  }
}
