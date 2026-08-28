import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { aiSettings, githubInstallations, sites, themeListings, users } from "@/db/schema";

const LIST_CAP = 300;

function sanitizeSearch(raw?: string): string {
  return (raw ?? "").trim().slice(0, 80).replace(/[%_\\]/g, "");
}

export async function getOpsOverview() {
  const [userRow] = await db.select({ value: count() }).from(users);
  const [siteRow] = await db.select({ value: count() }).from(sites);
  const [installRow] = await db.select({ value: count() }).from(githubInstallations);
  const [aiRow] = await db.select({ value: count() }).from(aiSettings);
  const [listedRow] = await db
    .select({ value: count() })
    .from(themeListings)
    .where(eq(themeListings.status, "listed"));
  const [hiddenRow] = await db
    .select({ value: count() })
    .from(themeListings)
    .where(eq(themeListings.status, "hidden"));

  const byTheme = await db
    .select({ key: sites.themeName, n: count() })
    .from(sites)
    .groupBy(sites.themeName)
    .orderBy(desc(count()));

  const byLanguage = await db
    .select({ key: sites.language, n: count() })
    .from(sites)
    .groupBy(sites.language)
    .orderBy(desc(count()));

  const bySourceKind = await db
    .select({
      key: sql<string>`case when ${sites.themeSource} = 'builtin' then 'builtin' else 'imported' end`,
      n: count(),
    })
    .from(sites)
    .groupBy(sql`case when ${sites.themeSource} = 'builtin' then 'builtin' else 'imported' end`);

  const recentSites = await db
    .select({
      id: sites.id,
      name: sites.name,
      slug: sites.slug,
      url: sites.url,
      themeName: sites.themeName,
      themeSource: sites.themeSource,
      dataRepo: sites.dataRepo,
      siteRepo: sites.siteRepo,
      pagesEnabled: sites.pagesEnabled,
      createdAt: sites.createdAt,
      ownerEmail: users.email,
      ownerName: users.name,
    })
    .from(sites)
    .leftJoin(users, eq(users.id, sites.userId))
    .orderBy(desc(sites.createdAt))
    .limit(12);

  return {
    users: userRow?.value ?? 0,
    sites: siteRow?.value ?? 0,
    installations: installRow?.value ?? 0,
    aiConfigured: aiRow?.value ?? 0,
    themesListed: listedRow?.value ?? 0,
    themesHidden: hiddenRow?.value ?? 0,
    byTheme,
    byLanguage,
    bySourceKind,
    recentSites,
  };
}

export async function listOpsUsers(q?: string) {
  const query = sanitizeSearch(q);
  const userRows = query
    ? await db
        .select()
        .from(users)
        .where(or(ilike(users.email, `%${query}%`), ilike(users.name, `%${query}%`)))
        .orderBy(users.email)
        .limit(LIST_CAP)
    : await db.select().from(users).orderBy(users.email).limit(LIST_CAP);

  const counts = await db.select({ userId: sites.userId, n: count() }).from(sites).groupBy(sites.userId);
  const countMap = new Map(counts.map((row) => [row.userId, row.n]));
  const aiIds = new Set(
    (await db.select({ userId: aiSettings.userId }).from(aiSettings)).map((row) => row.userId),
  );

  return userRows.map((user) => ({
    ...user,
    siteCount: countMap.get(user.id) ?? 0,
    hasAi: aiIds.has(user.id),
  }));
}

export async function listOpsSites(q?: string) {
  const query = sanitizeSearch(q);
  const rows = await db
    .select({
      id: sites.id,
      name: sites.name,
      slug: sites.slug,
      language: sites.language,
      themeName: sites.themeName,
      themeSource: sites.themeSource,
      dataRepo: sites.dataRepo,
      siteRepo: sites.siteRepo,
      url: sites.url,
      pagesEnabled: sites.pagesEnabled,
      createdAt: sites.createdAt,
      ownerEmail: users.email,
      ownerName: users.name,
      accountLogin: githubInstallations.accountLogin,
    })
    .from(sites)
    .leftJoin(users, eq(users.id, sites.userId))
    .leftJoin(githubInstallations, eq(githubInstallations.id, sites.installationId))
    .orderBy(desc(sites.createdAt))
    .limit(LIST_CAP);

  if (!query) return rows;
  const needle = query.toLowerCase();
  return rows.filter((row) =>
    [row.name, row.slug, row.dataRepo, row.siteRepo, row.ownerEmail, row.ownerName, row.accountLogin, row.themeName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle)),
  );
}

export async function listOpsInstallations() {
  const rows = await db
    .select({
      id: githubInstallations.id,
      installationId: githubInstallations.installationId,
      accountLogin: githubInstallations.accountLogin,
      accountType: githubInstallations.accountType,
      createdAt: githubInstallations.createdAt,
      ownerEmail: users.email,
      ownerName: users.name,
      ownerId: users.id,
    })
    .from(githubInstallations)
    .leftJoin(users, eq(users.id, githubInstallations.userId))
    .orderBy(desc(githubInstallations.createdAt))
    .limit(LIST_CAP);

  const counts = await db
    .select({ installationId: sites.installationId, n: count() })
    .from(sites)
    .groupBy(sites.installationId);
  const countMap = new Map(counts.map((row) => [row.installationId, row.n]));

  return rows.map((row) => ({
    ...row,
    siteCount: countMap.get(row.id) ?? 0,
  }));
}
