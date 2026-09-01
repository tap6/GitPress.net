import { and, eq } from "drizzle-orm";
import { redirectTo } from "@/i18n/redirect";
import { auth } from "@/auth";
import { db } from "@/db";
import { githubInstallations, sites } from "@/db/schema";

export type SiteRow = typeof sites.$inferSelect;
export type InstallationRow = typeof githubInstallations.$inferSelect;

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return await redirectTo("/login");
  return session.user as { id: string; name?: string | null; email?: string | null; image?: string | null };
}

export async function findOwnedSite(siteId: string): Promise<{
  user: { id: string; name?: string | null };
  site: SiteRow;
  installation: InstallationRow;
} | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = session.user as { id: string; name?: string | null };
  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.userId, user.id)))
    .limit(1);
  if (!site) return null;
  const [installation] = await db
    .select()
    .from(githubInstallations)
    .where(eq(githubInstallations.id, site.installationId))
    .limit(1);
  if (!installation) return null;
  return { user, site, installation };
}

/** Load a site, enforcing ownership. Redirects if not found. */
export async function requireSite(siteId: string): Promise<{
  user: { id: string; name?: string | null };
  site: SiteRow;
  installation: InstallationRow;
}> {
  const user = await requireUser();
  const owned = await findOwnedSite(siteId);
  if (!owned || owned.user.id !== user.id) return await redirectTo("/dashboard");
  return owned;
}

export async function listUserSites(userId: string): Promise<SiteRow[]> {
  return db.select().from(sites).where(eq(sites.userId, userId));
}

export async function listUserInstallations(userId: string): Promise<InstallationRow[]> {
  return db
    .select()
    .from(githubInstallations)
    .where(eq(githubInstallations.userId, userId));
}
