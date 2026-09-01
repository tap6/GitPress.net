import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { themeListings, type ThemeListingStatus } from "@/db/schema";

export type ThemeListingRow = typeof themeListings.$inferSelect;

export async function listListedThemeCatalog(): Promise<ThemeListingRow[]> {
  return db
    .select()
    .from(themeListings)
    .where(eq(themeListings.status, "listed"))
    .orderBy(asc(themeListings.displayName));
}

export async function listAllThemeListings(): Promise<ThemeListingRow[]> {
  return db.select().from(themeListings).orderBy(desc(themeListings.updatedAt));
}

export function listingStatusKey(status: ThemeListingStatus): "statusListed" | "statusHidden" | "statusPending" {
  if (status === "listed") return "statusListed";
  if (status === "hidden") return "statusHidden";
  return "statusPending";
}
