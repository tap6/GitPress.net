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

export function listingStatusLabel(status: ThemeListingStatus): string {
  if (status === "listed") return "已上架";
  if (status === "hidden") return "已下架";
  return "待审";
}
