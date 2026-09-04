"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirectTo } from "@/i18n/redirect";
import { actionError, wrapCaughtError } from "./actionError";
import { isNextControlFlowError } from "./nextControlFlow";
import { db } from "@/db";
import { githubInstallations, siteThemeLibrary, sites, themeListings } from "@/db/schema";
import {
  deleteAiConfig,
  generateDraft,
  generateSummary,
  getAiConfig,
  saveAiConfig,
  type DraftLength,
  type DraftTone,
} from "./ai";
import { persistSiteCategory, type SiteCategory } from "./categories";
import {
  addPageToNav,
  deleteMedia,
  deletePage,
  deletePost,
  findSlugConflict,
  getPost,
  getSiteConfig,
  isPagePath,
  listPosts,
  parseTagList,
  savePage,
  saveSiteBeian,
  saveSiteCategories,
  saveSiteFooter,
  saveSiteNav,
  savePost,
  slugify,
  updatePostMeta,
  updatePostsMeta,
  deletePosts,
  updateSiteConfig,
  uploadMedia,
} from "./content";
import {
  compileAnalyticsSnippet,
  parseAnalyticsProvider,
  parseDashboardUrl,
  persistSiteAnalytics,
  validateAnalyticsProviders,
} from "./analytics";
import { parseSiteComments, type SiteComments } from "./comments";
import { CommentsPermissionError, connectGiscus } from "./commentsConnect";
import { GITHUB_USER_RECONNECT, getInstallationOctokit, splitRepo, setPagesCustomDomain, putFile } from "./github";
import {
  MAX_BATCH_BYTES,
  MAX_BATCH_IMAGES,
  MAX_IMAGE_BYTES,
  sanitizeMediaFileName,
} from "./mediaName";
import { assertAllowedMediaUpload } from "./mediaTypes";
import { persistNavItem, type NavItem } from "./nav";
import { persistBeian, persistFooterItem, type FooterItem } from "./footer";
import { parsePostDate, readAuthorNow, attachOffset } from "./postDate";
import { readIanaTimeZone } from "./timeZones";
import {
  DEFAULT_PUBLISH_CHECK_INTERVAL,
  futureDateBlockedMessage,
  futureDateNotAllowed,
  isPublishCheckIntervalId,
  listScheduledPosts,
  projectQuotaUsage,
  publishCheckConfirmKey,
  QUOTA_CAUTION_PERCENT,
} from "./publishCheck";
import {
  listAccountPublishCheckContext,
  loadPublishCheck,
  writePublishCheckWorkflow,
} from "./publishCheckRepo";
import { resolvePublicOrigin } from "./customDomain";
import { provisionSite, rotateDeployKey, triggerRebuild, ProvisionPartialError, RepoAlreadyExistsError } from "./provision";
import { resolveGithubRepoSlug } from "./githubRepoSlug";
import { revalidateSiteData } from "./siteDataCache";
import { requireSite, requireUser } from "./sites";
import { getBuiltinTheme } from "./themes";
import {
  assertUsableThemeManifest,
  fetchGithubThemeManifest,
  formatGithubThemeSource,
  parseGithubThemeInput,
  parseGithubThemeSource,
  themeCardCacheFromManifest,
} from "./themeSource";
import {
  SITE_THEME_LIBRARY_LIMIT,
  findListedThemeSource,
  siteThemeLibraryCount,
} from "./themeLibrary";
import { upsertScratchNote } from "./scratchNote";
import { SCRATCH_NOTE_MAX_CHARS } from "./scratchNoteLimits";

// ---------------------------------------------------------------------------
// Site creation wizard
// ---------------------------------------------------------------------------

export interface CreateSiteState {
  error?: string;
}

function createSiteCaughtError(error: unknown, slug: string): CreateSiteState {
  if (error instanceof ProvisionPartialError) {
    return { error: actionError("initPartial", { repos: error.repos.join(", ") }) };
  }
  if (error instanceof RepoAlreadyExistsError || (error instanceof Error && error.message.includes("name already exists"))) {
    return { error: actionError("repoExists", { slug }) };
  }
  if (error instanceof Error && error.message === GITHUB_USER_RECONNECT) {
    return { error: actionError("githubReconnect") };
  }
  const message = error instanceof Error ? error.message : String(error);
  return { error: actionError("initFailed", { detail: message.slice(0, 300) }) };
}

export async function createSiteAction(
  _prev: CreateSiteState,
  formData: FormData,
): Promise<CreateSiteState> {
  const user = await requireUser();

  const installationRowId = String(formData.get("installation") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const language = String(formData.get("language") ?? "en");
  const themeName = String(formData.get("theme") ?? "");

  if (!name) return { error: actionError("needName") };
  const slug = resolveGithubRepoSlug(name, slugInput);
  if (!slug) {
    return { error: actionError("invalidSlug") };
  }
  if (!getBuiltinTheme(themeName)) return { error: actionError("needTheme") };

  const [installation] = await db
    .select()
    .from(githubInstallations)
    .where(eq(githubInstallations.id, installationRowId))
    .limit(1);
  if (!installation || installation.userId !== user.id) {
    return { error: actionError("needGithub") };
  }

  const dataRepoName = `${installation.accountLogin}/${slug}-data`;
  const [already] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.userId, user.id), eq(sites.dataRepo, dataRepoName)))
    .limit(1);
  if (already) {
    return await redirectTo(`/sites/${already.id}?created=1`);
  }

  let result;
  try {
    result = await provisionSite({
      installation,
      site: {
        name,
        slug,
        description,
        language,
        author: user.name?.trim() ?? "",
        themeName,
      },
    });
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return createSiteCaughtError(error, slug);
  }

  let siteId: string;
  try {
    const [row] = await db
      .insert(sites)
      .values({
        userId: user.id,
        installationId: installation.id,
        name,
        slug,
        description,
        language,
        themeName,
        themeSource: "builtin",
        dataRepo: result.dataRepo,
        siteRepo: result.siteRepo,
        url: result.url,
        basePath: result.basePath,
        pagesEnabled: result.pagesEnabled,
      })
      .returning({ id: sites.id });
    if (!row?.id) return { error: actionError("initRecordFailed") };
    siteId = row.id;
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return { error: wrapCaughtError(error, "initFailed") };
  }

  return await redirectTo(`/sites/${siteId}?created=1`);
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export interface SavePostState {
  error?: string;
}

export async function savePostAction(
  _prev: SavePostState,
  formData: FormData,
): Promise<SavePostState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: actionError("needTitle") };
  const body = String(formData.get("body") ?? "");
  const authorNow = readAuthorNow(formData);
  const dateWall = parsePostDate(formData.get("date")) ?? authorNow;
  const date = attachOffset(dateWall, formData.get("tzOffsetMinutes"));
  const timezone = readIanaTimeZone(formData);
  const draft = formData.get("draft") === "on";
  const description = String(formData.get("description") ?? "").trim();
  const tags = parseTagList(String(formData.get("tags") ?? ""));
  const category = String(formData.get("category") ?? "").trim() || undefined;

  const existingPath = String(formData.get("path") ?? "");
  const isNew = !existingPath;
  const requestedSlug = slugify(String(formData.get("slug") ?? "") || title);
  const path = existingPath || `content/posts/${requestedSlug}.md`;

  const octokit = await getInstallationOctokit(installation.installationId);
  const publishCheck = await loadPublishCheck(octokit, site.dataRepo, site.siteRepo);
  if (!publishCheck.enabled) {
    let previousDate: string | null = null;
    if (existingPath) {
      const existing = await getPost(octokit, site.dataRepo, existingPath);
      previousDate = existing?.date ?? null;
    }
    if (futureDateNotAllowed(dateWall, previousDate, authorNow)) {
      return { error: futureDateBlockedMessage() };
    }
  }
  const slugConflict = await findSlugConflict(octokit, site.dataRepo, "post", requestedSlug, existingPath || undefined);
  if (slugConflict) return { error: slugConflict };
  const mediaFiles = formData.getAll("media");
  const media: Array<{ name: string; base64: string }> = [];
  let batchBytes = 0;
  for (const file of mediaFiles) {
    if (!(file instanceof File) || file.size === 0) continue;
    if (!file.type.startsWith("image/")) {
      return { error: actionError("imagesOnly") };
    }
    if (file.size > MAX_IMAGE_BYTES) return { error: actionError("fileTooBig") };
    batchBytes += file.size;
    if (media.length >= MAX_BATCH_IMAGES) {
      return { error: actionError("tooManyImages", { n: MAX_BATCH_IMAGES }) };
    }
    if (batchBytes > MAX_BATCH_BYTES) return { error: actionError("batchTooBig") };
    const buffer = Buffer.from(await file.arrayBuffer());
    media.push({ name: sanitizeMediaFileName(file.name), base64: buffer.toString("base64") });
  }

  try {
    await savePost(
      octokit,
      site.dataRepo,
      path,
      { title, date, draft, tags, category, description, body, slug: requestedSlug, timezone },
      isNew,
      media,
    );
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }

  revalidateSiteData(site.dataRepo, [
    `/sites/${siteId}/posts`,
    `/sites/${siteId}`,
    `/sites/${siteId}/media`,
  ]);
  return await redirectTo(`/sites/${siteId}/posts?saved=${draft ? "draft" : "1"}`);
}

export async function deletePostAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const path = String(formData.get("path"));
  const { site, installation } = await requireSite(siteId);
  if (!path.startsWith("content/posts/")) throw new Error("Invalid path");
  const octokit = await getInstallationOctokit(installation.installationId);
  await deletePost(octokit, site.dataRepo, path);
  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/posts`, `/sites/${siteId}`]);
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export interface SavePageState {
  error?: string;
}

export async function savePageAction(
  _prev: SavePageState,
  formData: FormData,
): Promise<SavePageState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: actionError("needTitle") };
  const body = String(formData.get("body") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  const existingPath = String(formData.get("path") ?? "");
  const isNew = !existingPath;
  const slug = slugify(String(formData.get("slug") ?? "") || title, "page");
  const path = existingPath || `content/pages/${slug}.md`;
  if (!isPagePath(path)) return { error: actionError("invalidPagePath") };

  const octokit = await getInstallationOctokit(installation.installationId);
  const slugConflict = await findSlugConflict(octokit, site.dataRepo, "page", slug, existingPath || undefined);
  if (slugConflict) return { error: slugConflict };
  const mediaFiles = formData.getAll("media");
  const media: Array<{ name: string; base64: string }> = [];
  let batchBytes = 0;
  for (const file of mediaFiles) {
    if (!(file instanceof File) || file.size === 0) continue;
    if (!file.type.startsWith("image/")) {
      return { error: actionError("pageImagesOnly") };
    }
    if (file.size > MAX_IMAGE_BYTES) return { error: actionError("fileTooBig") };
    batchBytes += file.size;
    if (media.length >= MAX_BATCH_IMAGES) {
      return { error: actionError("tooManyPageImages", { n: MAX_BATCH_IMAGES }) };
    }
    if (batchBytes > MAX_BATCH_BYTES) return { error: actionError("batchTooBig") };
    const buffer = Buffer.from(await file.arrayBuffer());
    media.push({ name: sanitizeMediaFileName(file.name), base64: buffer.toString("base64") });
  }

  try {
    await savePage(octokit, site.dataRepo, path, { title, description, body, slug }, isNew, media);
    if (isNew && formData.get("addToNav") === "on") {
      await addPageToNav(octokit, site.dataRepo, slug);
    }
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }

  revalidateSiteData(site.dataRepo, [
    `/sites/${siteId}/pages`,
    `/sites/${siteId}/menu`,
    `/sites/${siteId}/settings`,
    `/sites/${siteId}`,
    `/sites/${siteId}/media`,
  ]);
  return await redirectTo(`/sites/${siteId}/pages?saved=1`);
}

export async function deletePageAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const path = String(formData.get("path"));
  const { site, installation } = await requireSite(siteId);
  if (!isPagePath(path)) throw new Error("Invalid path");
  const octokit = await getInstallationOctokit(installation.installationId);
  await deletePage(octokit, site.dataRepo, path);
  revalidateSiteData(site.dataRepo, [
    `/sites/${siteId}/pages`,
    `/sites/${siteId}/menu`,
    `/sites/${siteId}/settings`,
    `/sites/${siteId}`,
  ]);
}

export interface UpdatePostMetaState {
  error?: string;
}

function assertPostPath(path: string): string {
  if (!path.startsWith("content/posts/") || path.includes("..")) {
    throw new Error("Invalid path");
  }
  return path;
}

/** Quick-edit a single post's metadata from the posts list (body is left as-is). */
export async function updatePostMetaAction(
  _prev: UpdatePostMetaState,
  formData: FormData,
): Promise<UpdatePostMetaState> {
  const siteId = String(formData.get("siteId"));
  const path = assertPostPath(String(formData.get("path") ?? ""));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: actionError("needTitle") };
  const authorNow = readAuthorNow(formData);
  const dateWall = parsePostDate(formData.get("date")) ?? authorNow;
  const date = attachOffset(dateWall, formData.get("tzOffsetMinutes"));
  const timezone = readIanaTimeZone(formData);
  const draft = String(formData.get("status") ?? "") === "draft";
  const tags = parseTagList(String(formData.get("tags") ?? ""));
  const categoryRaw = String(formData.get("category") ?? "").trim();

  const { site, installation } = await requireSite(siteId);
  const octokit = await getInstallationOctokit(installation.installationId);
  const existing = await getPost(octokit, site.dataRepo, path);
  const publishCheck = await loadPublishCheck(octokit, site.dataRepo, site.siteRepo);
  if (!publishCheck.enabled && futureDateNotAllowed(dateWall, existing?.date ?? null, authorNow)) {
    return { error: futureDateBlockedMessage() };
  }
  try {
    await updatePostMeta(octokit, site.dataRepo, path, {
      title,
      date,
      draft,
      tags,
      category: categoryRaw || null,
      timezone,
    });
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }
  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/posts`, `/sites/${siteId}`]);
  return {};
}

export interface BulkPostsState {
  error?: string;
}

/**
 * Bulk publish / unpublish (draft) / delete. "不可见" is the existing `draft:
 * true` flag — static sites have no logged-in-only view, so draft is the
 * way to keep a post out of the public build.
 */
export async function bulkPostsAction(
  _prev: BulkPostsState,
  formData: FormData,
): Promise<BulkPostsState> {
  const siteId = String(formData.get("siteId"));
  const op = String(formData.get("op") ?? "");
  const paths = formData
    .getAll("paths")
    .map(String)
    .filter((path) => path.startsWith("content/posts/") && !path.includes(".."));
  if (paths.length === 0) return { error: actionError("needPosts") };
  if (op !== "draft" && op !== "publish" && op !== "delete") {
    return { error: actionError("unknownAction") };
  }

  const { site, installation } = await requireSite(siteId);
  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    if (op === "delete") {
      await deletePosts(octokit, site.dataRepo, paths);
    } else {
      await updatePostsMeta(octokit, site.dataRepo, paths, { draft: op === "draft" });
    }
  } catch (error) {
    return { error: wrapCaughtError(error, "actionFailed") };
  }
  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/posts`, `/sites/${siteId}`]);
  return {};
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export async function uploadMediaAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > 8 * 1024 * 1024) throw new Error(actionError("fileTooBig"));
  assertAllowedMediaUpload(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const octokit = await getInstallationOctokit(installation.installationId);
  await uploadMedia(octokit, site.dataRepo, file.name, buffer.toString("base64"));
  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/media`]);
}

export interface UploadEditorImageState {
  url?: string;
  error?: string;
}

/**
 * Immediate single-file upload (one Git commit). The post editor no longer
 * uses this — images are attached to `savePostAction` so N pictures share one
 * Actions run. Kept for any client that still needs a direct media commit.
 */
export async function uploadEditorImageAction(formData: FormData): Promise<UploadEditorImageState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: actionError("needImage") };
  if (file.size > 8 * 1024 * 1024) return { error: actionError("fileTooBig") };
  const buffer = Buffer.from(await file.arrayBuffer());
  const octokit = await getInstallationOctokit(installation.installationId);
  const url = await uploadMedia(octokit, site.dataRepo, file.name, buffer.toString("base64"));
  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/media`]);
  return { url };
}

export async function deleteMediaAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const path = String(formData.get("path"));
  const { site, installation } = await requireSite(siteId);
  if (!path.startsWith("media/")) throw new Error("Invalid path");
  const octokit = await getInstallationOctokit(installation.installationId);
  await deleteMedia(octokit, site.dataRepo, path);
  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/media`]);
}

// ---------------------------------------------------------------------------
// Appearance & settings
// ---------------------------------------------------------------------------

export async function switchThemeAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const themeName = String(formData.get("theme"));
  const { site, installation } = await requireSite(siteId);
  if (!getBuiltinTheme(themeName)) throw new Error(actionError("unknownTheme"));
  await persistActiveTheme(site, installation, {
    name: themeName,
    source: "builtin",
    ref: "v1",
    commitMessage: `Switch theme to ${themeName}`,
  });
}

async function persistActiveTheme(
  site: { id: string; dataRepo: string; themeName: string; themeSource: string },
  installation: { installationId: number },
  next: { name: string; source: string; ref: string; commitMessage: string },
): Promise<void> {
  const octokit = await getInstallationOctokit(installation.installationId);
  const siteConfig = await getSiteConfig(octokit, site.dataRepo);
  const currentSource = String(siteConfig?.theme.source ?? site.themeSource ?? "builtin");
  const currentName = String(siteConfig?.theme.name ?? site.themeName);
  const resetConfig = currentSource !== next.source || currentName !== next.name;

  await updateSiteConfig(
    octokit,
    site.dataRepo,
    (config) => {
      config.theme.name = next.name;
      config.theme.source = next.source;
      config.theme.ref = next.ref;
      if (resetConfig) config.theme.config = {};
    },
    next.commitMessage,
  );
  await db
    .update(sites)
    .set({
      themeName: next.name,
      themeSource: next.source,
      ...(resetConfig ? { themeConfig: {} } : {}),
    })
    .where(eq(sites.id, site.id));
  revalidateSiteData(site.dataRepo, [`/sites/${site.id}/appearance`, `/sites/${site.id}`]);
}

export async function saveThemeOptionsAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  const octokit = await getInstallationOctokit(installation.installationId);
  const siteConfig = await getSiteConfig(octokit, site.dataRepo);
  const source = String(siteConfig?.theme.source ?? "builtin");

  // Driven entirely by the theme's own configSchema (theme.json) so any
  // theme's declared options are saved correctly without a platform code
  // change — see lib/themes.ts for why this replaced a hand-maintained list.
  const properties =
    source === "builtin"
      ? (getBuiltinTheme(site.themeName)?.configSchema.properties ?? {})
      : ((await fetchGithubThemeManifest(source))?.configSchema?.properties ?? {});
  if (Object.keys(properties).length === 0) throw new Error(actionError("noThemeOptions"));

  const config: Record<string, unknown> = {};
  for (const [key, property] of Object.entries(properties)) {
    const raw = formData.get(`opt_${key}`);
    if (property.type === "boolean") {
      config[key] = raw === "on";
    } else if (property.type === "number" || property.type === "integer") {
      const parsed = Number(raw);
      config[key] = Number.isFinite(parsed) ? parsed : property.default;
    } else {
      config[key] = raw != null && raw !== "" ? String(raw) : property.default;
    }
  }

  await updateSiteConfig(
    octokit,
    site.dataRepo,
    (cfg) => {
      cfg.theme.config = { ...(cfg.theme.config ?? {}), ...config };
    },
    "Update theme options",
  );
  await db.update(sites).set({ themeConfig: config }).where(eq(sites.id, siteId));
  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/appearance`]);
}

export interface ImportThemeState {
  error?: string;
  saved?: boolean;
  name?: string;
}

export async function importThemeAction(
  _prev: ImportThemeState,
  formData: FormData,
): Promise<ImportThemeState> {
  const siteId = String(formData.get("siteId"));
  const { site } = await requireSite(siteId);

  let parsed;
  try {
    parsed = parseGithubThemeInput(
      String(formData.get("repo") ?? ""),
      String(formData.get("subdir") ?? ""),
      String(formData.get("ref") ?? ""),
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  const source = formatGithubThemeSource(parsed);
  if (await findListedThemeSource(source)) {
    return { error: actionError("alreadyListed") };
  }

  const [existing] = await db
    .select({ id: siteThemeLibrary.id })
    .from(siteThemeLibrary)
    .where(and(eq(siteThemeLibrary.siteId, site.id), eq(siteThemeLibrary.source, source)))
    .limit(1);
  if (existing) return { error: actionError("alreadyImported") };

  if ((await siteThemeLibraryCount(site.id)) >= SITE_THEME_LIBRARY_LIMIT) {
    return { error: actionError("libraryLimit", { n: SITE_THEME_LIBRARY_LIMIT }) };
  }

  const manifest = await fetchGithubThemeManifest(source);
  if (!manifest) {
    return { error: actionError("themeJsonPublic") };
  }
  try {
    assertUsableThemeManifest(manifest);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  try {
    await db.insert(siteThemeLibrary).values({
      siteId: site.id,
      source,
      ...themeCardCacheFromManifest(source, manifest),
    });
  } catch (error) {
    return { error: wrapCaughtError(error, "addFailed") };
  }

  revalidateSiteData(site.dataRepo, [`/sites/${site.id}/appearance`]);
  return { saved: true, name: manifest.displayName?.trim() || manifest.name };
}

export async function applyCatalogThemeAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const listingId = String(formData.get("listingId"));
  const { site, installation } = await requireSite(siteId);
  const [listing] = await db
    .select()
    .from(themeListings)
    .where(and(eq(themeListings.id, listingId), eq(themeListings.status, "listed")))
    .limit(1);
  if (!listing) throw new Error(actionError("themeNotListed"));

  const parsed = parseGithubThemeSource(listing.source);
  if (!parsed) throw new Error(actionError("themeUrlInvalid"));

  const manifest = await fetchGithubThemeManifest(listing.source);
  if (!manifest) throw new Error(actionError("themeJsonMissing"));
  assertUsableThemeManifest(manifest);
  await persistActiveTheme(site, installation, {
    name: manifest.name,
    source: listing.source,
    ref: parsed.ref,
    commitMessage: `Switch theme to ${manifest.name} from ${listing.source}`,
  });
}

export async function enableLibraryThemeAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const libraryId = String(formData.get("libraryId"));
  const { site, installation } = await requireSite(siteId);
  const [row] = await db
    .select()
    .from(siteThemeLibrary)
    .where(and(eq(siteThemeLibrary.id, libraryId), eq(siteThemeLibrary.siteId, site.id)))
    .limit(1);
  if (!row) throw new Error(actionError("importMissing"));

  const parsed = parseGithubThemeSource(row.source);
  if (!parsed) throw new Error(actionError("themeUrlInvalid"));

  const manifest = await fetchGithubThemeManifest(row.source);
  if (!manifest) throw new Error(actionError("themeJsonMissing"));
  assertUsableThemeManifest(manifest);
  await persistActiveTheme(site, installation, {
    name: manifest.name,
    source: row.source,
    ref: parsed.ref,
    commitMessage: `Switch theme to ${manifest.name} from ${row.source}`,
  });
}

export async function removeLibraryThemeAction(
  _prev: ImportThemeState,
  formData: FormData,
): Promise<ImportThemeState> {
  const siteId = String(formData.get("siteId"));
  const libraryId = String(formData.get("libraryId"));
  const { site, installation } = await requireSite(siteId);
  const [row] = await db
    .select()
    .from(siteThemeLibrary)
    .where(and(eq(siteThemeLibrary.id, libraryId), eq(siteThemeLibrary.siteId, site.id)))
    .limit(1);
  if (!row) return { error: actionError("importMissing") };

  const octokit = await getInstallationOctokit(installation.installationId);
  const siteConfig = await getSiteConfig(octokit, site.dataRepo);
  const currentSource = String(siteConfig?.theme.source ?? site.themeSource ?? "builtin");
  if (currentSource === row.source) {
    return { error: actionError("isCurrentTheme") };
  }

  await db.delete(siteThemeLibrary).where(eq(siteThemeLibrary.id, row.id));
  revalidateSiteData(site.dataRepo, [`/sites/${site.id}/appearance`]);
  return { saved: true, name: row.displayName };
}

export interface SaveBrandState {
  error?: string;
  saved?: boolean;
}

function parseImageDataUrl(raw: string): { mime: string; bytes: Buffer } | null {
  const match = raw.trim().match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i);
  if (!match) return null;
  const mime = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  return { mime, bytes: Buffer.from(match[2], "base64") };
}

function extForImageMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function saveBrandAction(
  _prev: SaveBrandState,
  formData: FormData,
): Promise<SaveBrandState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  const octokit = await getInstallationOctokit(installation.installationId);

  async function uploadBrand(dataUrl: string, stem: string): Promise<string | { error: string }> {
    const parsed = parseImageDataUrl(dataUrl);
    if (!parsed) return { error: actionError("badCrop", { stem }) };
    if (parsed.bytes.length > MAX_IMAGE_BYTES) return { error: actionError("cropTooBig", { stem }) };
    return uploadMedia(
      octokit,
      site.dataRepo,
      `${stem}.${extForImageMime(parsed.mime)}`,
      parsed.bytes.toString("base64"),
    );
  }

  const logoData = String(formData.get("logoDataUrl") ?? "");
  const avatarData = String(formData.get("avatarDataUrl") ?? "");
  let logoPath: string | null | undefined;
  let avatarPath: string | null | undefined;

  if (logoData) {
    const result = await uploadBrand(logoData, "site-logo");
    if (typeof result !== "string") return result;
    logoPath = result;
  } else if (formData.get("removeLogo") === "on") {
    logoPath = null;
  }

  if (avatarData) {
    const result = await uploadBrand(avatarData, "site-avatar");
    if (typeof result !== "string") return result;
    avatarPath = result;
  } else if (formData.get("removeAvatar") === "on") {
    avatarPath = null;
  }

  if (logoPath === undefined && avatarPath === undefined) {
    return { error: actionError("needBrandChoice") };
  }

  try {
    await updateSiteConfig(
      octokit,
      site.dataRepo,
      (config) => {
        if (logoPath === null) delete config.site.logo;
        else if (logoPath) config.site.logo = logoPath;
        if (avatarPath === null) delete config.site.avatar;
        else if (avatarPath) config.site.avatar = avatarPath;
      },
      "Update site logo and avatar",
    );
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }

  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/settings`, `/sites/${siteId}/media`]);
  return { saved: true };
}

export interface SaveSettingsState {
  error?: string;
  saved?: boolean;
}

export async function saveSettingsAction(
  _prev: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: actionError("needName") };
  const description = String(formData.get("description") ?? "").trim();
  const language = String(formData.get("language") ?? "en");
  const author = String(formData.get("author") ?? "").trim();
  const timezone = readIanaTimeZone(formData);

  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    await updateSiteConfig(
      octokit,
      site.dataRepo,
      (config) => {
        config.site.title = name;
        config.site.description = description;
        config.site.language = language;
        if (timezone) config.site.timezone = timezone;
        if (author) config.site.author = author;
        else delete config.site.author;
        config.site.convertUploadsToWebp = formData.get("convertUploadsToWebp") === "on";
      },
      "Update site settings",
    );
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }

  await db.update(sites).set({ name, description, language }).where(eq(sites.id, siteId));
  revalidateSiteData(site.dataRepo, [
    `/sites/${siteId}/settings`,
    `/sites/${siteId}`,
    `/sites/${siteId}/media`,
  ]);
  return { saved: true };
}

export interface SaveAnalyticsState {
  error?: string;
  saved?: boolean;
  rebuilt?: boolean;
}

export async function saveAnalyticsAction(
  _prev: SaveAnalyticsState,
  formData: FormData,
): Promise<SaveAnalyticsState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);

  let incoming: unknown;
  try {
    incoming = JSON.parse(String(formData.get("providers") ?? "[]"));
  } catch {
    return { error: actionError("badAnalytics") };
  }
  if (!Array.isArray(incoming) || incoming.length > 20) {
    return { error: actionError("badAnalyticsShort") };
  }
  for (const item of incoming) {
    if (!item || typeof item !== "object") continue;
    const url = (item as { dashboardUrl?: unknown }).dashboardUrl;
    if (typeof url === "string" && url.trim()) {
      const parsed = parseDashboardUrl(url);
      if ("error" in parsed) return { error: parsed.error };
    }
  }
  const providers = incoming
    .map((item) => parseAnalyticsProvider(item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (providers.length !== incoming.length) {
    return { error: actionError("badAnalytics") };
  }
  const invalid = validateAnalyticsProviders(providers);
  if (invalid) return { error: invalid };

  const persisted = persistSiteAnalytics(providers);
  const nextSnippet = compileAnalyticsSnippet(persisted?.providers ?? []);

  const octokit = await getInstallationOctokit(installation.installationId);
  let rebuilt = false;
  try {
    await updateSiteConfig(
      octokit,
      site.dataRepo,
      (config) => {
        const previous =
          typeof config.site.analyticsSnippet === "string" ? config.site.analyticsSnippet.trim() : "";
        rebuilt = previous !== nextSnippet;
        if (persisted) config.site.analytics = persisted;
        else delete config.site.analytics;
        if (nextSnippet) config.site.analyticsSnippet = nextSnippet;
        else delete config.site.analyticsSnippet;
      },
      rebuilt ? "Update site analytics" : "Update site analytics [skip ci]",
    );
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }

  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/analytics`, `/sites/${siteId}/settings`]);
  return { saved: true, rebuilt };
}

export interface SaveCommentsState {
  error?: string;
  saved?: boolean;
  reviewUrl?: string;
}

function commentsFromConfig(config: { site: Record<string, unknown> }): SiteComments {
  return parseSiteComments(config.site.comments);
}

export async function connectGiscusAction(
  _prev: SaveCommentsState,
  formData: FormData,
): Promise<SaveCommentsState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  const octokit = await getInstallationOctokit(installation.installationId);
  const config = await getSiteConfig(octokit, site.dataRepo);
  const language = typeof config?.site.language === "string" ? config.site.language : site.language;

  try {
    const giscus = await connectGiscus(octokit, {
      siteRepo: site.siteRepo,
      language,
      installationId: installation.installationId,
    });
    await updateSiteConfig(
      octokit,
      site.dataRepo,
      (next) => {
        const current = commentsFromConfig(next);
        next.site.comments = { ...current, enabled: true, giscus };
      },
      "Connect giscus comments",
    );
  } catch (error) {
    if (error instanceof CommentsPermissionError) {
      return { error: error.message, reviewUrl: error.permissionGap?.reviewUrl };
    }
    return { error: wrapCaughtError(error, "connectFailed") };
  }

  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/settings`, `/sites/${siteId}`]);
  return { saved: true };
}

export async function setCommentsEnabledAction(
  _prev: SaveCommentsState,
  formData: FormData,
): Promise<SaveCommentsState> {
  const siteId = String(formData.get("siteId"));
  const enabled = String(formData.get("enabled")) === "true";
  const { site, installation } = await requireSite(siteId);
  const octokit = await getInstallationOctokit(installation.installationId);

  try {
    await updateSiteConfig(
      octokit,
      site.dataRepo,
      (config) => {
        const current = commentsFromConfig(config);
        config.site.comments = { ...current, enabled };
      },
      enabled ? "Enable comments" : "Disable comments",
    );
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }

  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/settings`, `/sites/${siteId}`]);
  return { saved: true };
}

export async function disconnectGiscusAction(
  _prev: SaveCommentsState,
  formData: FormData,
): Promise<SaveCommentsState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  const octokit = await getInstallationOctokit(installation.installationId);

  try {
    await updateSiteConfig(
      octokit,
      site.dataRepo,
      (config) => {
        const current = commentsFromConfig(config);
        const next: SiteComments = { ...current, enabled: false };
        delete next.giscus;
        if (next.enabled === false && !config.site.commentsSnippet) {
          delete config.site.comments;
        } else {
          config.site.comments = next;
        }
      },
      "Disconnect giscus comments",
    );
  } catch (error) {
    return { error: wrapCaughtError(error, "disconnectFailed") };
  }

  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/settings`, `/sites/${siteId}`]);
  return { saved: true };
}

/** Advanced fallback: raw embed snippet when giscus is not connected. */
export async function saveCommentsAction(
  _prev: SaveCommentsState,
  formData: FormData,
): Promise<SaveCommentsState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  const commentsSnippet = String(formData.get("commentsSnippet") ?? "").trim();

  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    await updateSiteConfig(
      octokit,
      site.dataRepo,
      (config) => {
        if (commentsFromConfig(config).giscus) {
          throw new Error(actionError("giscusConnected"));
        }
        if (commentsSnippet) {
          config.site.commentsSnippet = commentsSnippet;
          const current = commentsFromConfig(config);
          config.site.comments = { ...current, enabled: true };
        } else {
          delete config.site.commentsSnippet;
          const current = commentsFromConfig(config);
          if (current.enabled === undefined && !current.giscus) {
            delete config.site.comments;
          }
        }
      },
      "Update comments snippet",
    );
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }

  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/settings`, `/sites/${siteId}`]);
  return { saved: true };
}

export interface SaveSiteUrlState {
  error?: string;
  saved?: boolean;
}

function pagesApiError(error: unknown): string {
  const err = error as {
    status?: number;
    message?: string;
    response?: { data?: { message?: string } };
  };
  const detail = err.response?.data?.message ?? err.message ?? "";
  if (err.status === 403) return actionError("pagesForbidden");
  if (err.status === 422 || err.status === 400) {
    if (/taken|already in use/i.test(detail)) return actionError("domainTaken");
    return detail ? actionError("domainRejected", { detail }) : actionError("domainRejectedGeneric");
  }
  return error instanceof Error ? error.message : actionError("saveRetry");
}

async function clearPagesCustomDomain(
  octokit: Awaited<ReturnType<typeof getInstallationOctokit>>,
  siteRef: ReturnType<typeof splitRepo>,
): Promise<void> {
  await setPagesCustomDomain(octokit, siteRef, null);
}

export async function saveSiteUrlAction(
  _prev: SaveSiteUrlState,
  formData: FormData,
): Promise<SaveSiteUrlState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  const resolved = resolvePublicOrigin(String(formData.get("origin") ?? ""), site.siteRepo);
  if ("error" in resolved) return { error: resolved.error };

  const registerPages = formData.get("registerPages") === "on" && !resolved.isDefaultPages;
  const octokit = await getInstallationOctokit(installation.installationId);
  const siteRef = splitRepo(site.siteRepo);
  const message = resolved.isDefaultPages
    ? "Remove custom domain"
    : registerPages
      ? `Set custom domain: ${resolved.host}`
      : `Update site URL: ${resolved.host}`;

  try {
    if (registerPages) {
      try {
        await setPagesCustomDomain(octokit, siteRef, resolved.host);
        await putFile(
          octokit,
          siteRef,
          "CNAME",
          { utf8: `${resolved.host}\n` },
          `Set custom domain: ${resolved.host}`,
        );
      } catch (error) {
        return { error: pagesApiError(error) };
      }
    } else {
      try {
        await clearPagesCustomDomain(octokit, siteRef);
      } catch (error) {
        return { error: pagesApiError(error) };
      }
    }

    await updateSiteConfig(
      octokit,
      site.dataRepo,
      (config) => {
        config.site.url = resolved.url;
        config.site.basePath = resolved.basePath;
      },
      message,
    );
  } catch (error) {
    return { error: pagesApiError(error) };
  }

  await db
    .update(sites)
    .set({ url: resolved.url, basePath: resolved.basePath })
    .where(eq(sites.id, siteId));
  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/settings`, `/sites/${siteId}`]);
  const notice = resolved.isDefaultPages ? "reset" : registerPages ? "pages" : "url";
  return await redirectTo(`/sites/${siteId}/settings?domain=${notice}`);
}

export async function unregisterPagesDomainAction(
  _prev: SaveSiteUrlState,
  formData: FormData,
): Promise<SaveSiteUrlState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    await clearPagesCustomDomain(octokit, splitRepo(site.siteRepo));
  } catch (error) {
    return { error: pagesApiError(error) };
  }
  revalidatePath(`/sites/${siteId}/settings`);
  return await redirectTo(`/sites/${siteId}/settings?domain=unpages`);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export interface SaveCategoriesState {
  error?: string;
  saved?: boolean;
}

export async function saveCategoriesAction(
  _prev: SaveCategoriesState,
  formData: FormData,
): Promise<SaveCategoriesState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);

  let categories: SiteCategory[];
  try {
    const parsed = JSON.parse(String(formData.get("categoriesJson") ?? "[]"));
    if (!Array.isArray(parsed)) throw new Error("invalid");
    const seen = new Set<string>();
    categories = parsed.map((item: unknown) => {
      const label = String((item as { label?: unknown })?.label ?? "").trim();
      if (!label) throw new Error(actionError("emptyCategoryName"));
      let slug = slugify(String((item as { slug?: unknown })?.slug ?? "") || label);
      while (seen.has(slug)) slug = `${slug}-2`;
      seen.add(slug);
      return persistSiteCategory({
        slug,
        label,
        inNav: (item as { inNav?: unknown }).inNav === false ? false : undefined,
      });
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : actionError("badCategories") };
  }

  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    await saveSiteCategories(octokit, site.dataRepo, categories);
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }

  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/categories`, `/sites/${siteId}/posts`]);
  return { saved: true };
}

// ---------------------------------------------------------------------------
// Menu (top-nav)
// ---------------------------------------------------------------------------

export interface SaveMenuState {
  error?: string;
  saved?: boolean;
}

export async function saveMenuAction(
  _prev: SaveMenuState,
  formData: FormData,
): Promise<SaveMenuState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);

  let nav: NavItem[];
  try {
    const parsed = JSON.parse(String(formData.get("navJson") ?? "[]"));
    if (!Array.isArray(parsed)) throw new Error("invalid");
    nav = parsed.map((raw: unknown) => {
      const item = raw as Record<string, unknown>;
      const label = typeof item.label === "string" ? item.label.trim() : "";
      switch (item.type) {
        case "home":
          return persistNavItem({ type: "home", label: label || undefined });
        case "rss":
          return persistNavItem({ type: "rss", label: label || undefined });
        case "category": {
          const slug = String(item.slug ?? "").trim();
          if (!slug) throw new Error(actionError("menuCategorySlug"));
          return persistNavItem({ type: "category", slug, label: label || undefined });
        }
        case "page": {
          const slug = String(item.slug ?? "").trim();
          if (!slug) throw new Error(actionError("menuPageSlug"));
          return persistNavItem({ type: "page", slug, label: label || undefined });
        }
        case "link": {
          const url = String(item.url ?? "").trim();
          if (!url) throw new Error(actionError("needCustomUrl"));
          if (!label) throw new Error(actionError("needCustomLabel"));
          return persistNavItem({ type: "link", url, label });
        }
        default:
          throw new Error(actionError("unknownMenuType", { type: String(item.type) }));
      }
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : actionError("badMenu") };
  }

  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    await saveSiteNav(octokit, site.dataRepo, nav);
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }

  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/menu`]);
  return { saved: true };
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export interface SaveFooterState {
  error?: string;
  saved?: boolean;
}

export async function saveFooterAction(
  _prev: SaveFooterState,
  formData: FormData,
): Promise<SaveFooterState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);

  let footer: FooterItem[];
  try {
    const parsed = JSON.parse(String(formData.get("footerJson") ?? "[]"));
    if (!Array.isArray(parsed)) throw new Error("invalid");
    footer = parsed.map((raw: unknown) => {
      const item = raw as Record<string, unknown>;
      const label = typeof item.label === "string" ? item.label.trim() : "";
      switch (item.type) {
        case "copyright":
          return persistFooterItem({ type: "copyright", label: label || undefined });
        case "gitpress":
          return persistFooterItem({ type: "gitpress", label: label || undefined });
        case "theme":
          return persistFooterItem({ type: "theme", label: label || undefined });
        case "rss":
          return persistFooterItem({ type: "rss", label: label || undefined });
        case "page": {
          const slug = String(item.slug ?? "").trim();
          if (!slug) throw new Error(actionError("footerPageSlug"));
          return persistFooterItem({ type: "page", slug, label: label || undefined });
        }
        case "link": {
          const url = String(item.url ?? "").trim();
          if (!url) throw new Error(actionError("needCustomUrl"));
          if (!label) throw new Error(actionError("needCustomLabel"));
          return persistFooterItem({ type: "link", url, label });
        }
        case "text":
          if (!label) throw new Error(actionError("emptyText"));
          return persistFooterItem({ type: "text", label });
        default:
          throw new Error(actionError("unknownFooterType", { type: String(item.type) }));
      }
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : actionError("badFooter") };
  }

  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    await saveSiteFooter(octokit, site.dataRepo, footer);
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }

  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/settings`]);
  return { saved: true };
}

export interface SaveBeianState {
  error?: string;
  saved?: boolean;
}

export async function saveBeianAction(
  _prev: SaveBeianState,
  formData: FormData,
): Promise<SaveBeianState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  const beian = persistBeian({
    icp: String(formData.get("icp") ?? ""),
    gongan: String(formData.get("gongan") ?? ""),
  }) ?? {};

  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    await saveSiteBeian(octokit, site.dataRepo, beian);
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }

  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/settings`]);
  return { saved: true };
}

export interface SavePublishCheckState {
  error?: string;
  blockedPosts?: Array<{ title: string; path: string }>;
  needsConfirm?: boolean;
  confirmKey?: string;
  warning?: string;
  reasons?: string[];
  projectedPercent?: number;
}

export async function savePublishCheckAction(
  _prev: SavePublishCheckState,
  formData: FormData,
): Promise<SavePublishCheckState> {
  const siteId = String(formData.get("siteId"));
  const { site, installation, user } = await requireSite(siteId);
  const enabled = formData.get("enabled") === "on";
  const intervalRaw = String(formData.get("interval") ?? "");
  const interval = isPublishCheckIntervalId(intervalRaw)
    ? intervalRaw
    : DEFAULT_PUBLISH_CHECK_INTERVAL;
  const confirmKey = publishCheckConfirmKey(enabled, enabled ? interval : null);
  const confirmed = String(formData.get("confirmedFor") ?? "") === confirmKey;

  const octokit = await getInstallationOctokit(installation.installationId);
  if (!enabled) {
    const scheduled = listScheduledPosts(await listPosts(octokit, site.dataRepo), readAuthorNow(formData));
    if (scheduled.length > 0) {
      return {
        error: actionError("cannotDisableSchedule"),
        blockedPosts: scheduled,
      };
    }
  }

  if (enabled && !confirmed) {
    const [current, account] = await Promise.all([
      loadPublishCheck(octokit, site.dataRepo, site.siteRepo),
      listAccountPublishCheckContext(user.id, site.id, installation.accountLogin),
    ]);
    const projection = projectQuotaUsage({
      enabled,
      interval,
      isPrivate: current.dataRepoPrivate,
      otherMinutes: account.otherPrivateMinutes,
      saveMinutes: 0,
      otherChecks: account.otherChecks,
    });
    if (projection.percent >= QUOTA_CAUTION_PERCENT && current.dataRepoPrivate) {
      return {
        needsConfirm: true,
        confirmKey,
        projectedPercent: projection.percent,
        reasons: projection.reasons,
        warning: actionError("quotaCaution", { percent: projection.percent }),
      };
    }
  }

  try {
    await writePublishCheckWorkflow(
      octokit,
      site.dataRepo,
      site.siteRepo,
      enabled ? interval : null,
      enabled
        ? `Update publish check interval (${interval}) [skip ci]`
        : "Turn off publish check [skip ci]",
    );
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }

  revalidateSiteData(site.dataRepo, [
    `/sites/${siteId}`,
    `/sites/${siteId}/settings`,
    `/sites/${siteId}/posts`,
  ]);
  return {};
}

export async function rebuildAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  await triggerRebuild(installation.installationId, site.dataRepo);
  revalidateSiteData(site.dataRepo, [`/sites/${siteId}`, `/sites/${siteId}/settings`]);
}

export async function recheckGiscusAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  await requireSite(siteId);
  revalidatePath(`/sites/${siteId}/settings`);
}

/**
 * Regenerates the deploy key (fixes sites created before the OpenSSH
 * key-format fix, where the site repo never actually received a build)
 * and kicks off a fresh build.
 */
export async function rotateDeployKeyAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  await rotateDeployKey(installation.installationId, site.dataRepo, site.siteRepo);
  revalidateSiteData(site.dataRepo, [`/sites/${siteId}`, `/sites/${siteId}/settings`]);
}

export interface DisconnectSiteState {
  error?: string;
}

/** Drop the control-plane pointer. Never deletes GitHub repositories. */
export async function disconnectSiteAction(
  _prev: DisconnectSiteState,
  formData: FormData,
): Promise<DisconnectSiteState> {
  const siteId = String(formData.get("siteId") ?? "");
  const typed = String(formData.get("confirmName") ?? "").trim();
  const { site } = await requireSite(siteId);
  if (typed !== site.name.trim() && typed !== site.slug) {
    return { error: actionError("disconnectConfirm") };
  }
  await db.delete(sites).where(eq(sites.id, site.id));
  revalidatePath("/dashboard");
  revalidatePath(`/sites/${site.id}`);
  return await redirectTo("/dashboard");
}

export async function refreshGitHistoryAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  await requireSite(siteId);
  const page = Number.parseInt(String(formData.get("page") ?? "1"), 10) || 1;
  const path = page > 1 ? `/sites/${siteId}/history?page=${page}` : `/sites/${siteId}/history`;
  revalidatePath(`/sites/${siteId}/history`);
  return await redirectTo(path);
}

// ---------------------------------------------------------------------------
// Dashboard scratch note (Neon only — does not touch GitHub)
// ---------------------------------------------------------------------------

export interface ScratchNoteSaveState {
  error?: string;
  saved?: boolean;
}

export async function saveScratchNoteAction(
  siteId: string,
  body: string,
): Promise<ScratchNoteSaveState> {
  await requireSite(siteId);
  if (body.length > SCRATCH_NOTE_MAX_CHARS) {
    return { error: actionError("scratchLimit", { n: SCRATCH_NOTE_MAX_CHARS }) };
  }
  await upsertScratchNote(siteId, { body });
  return { saved: true };
}

export async function disableScratchNoteAction(siteId: string): Promise<ScratchNoteSaveState> {
  await requireSite(siteId);
  await upsertScratchNote(siteId, { enabled: false });
  revalidatePath(`/sites/${siteId}`);
  revalidatePath(`/sites/${siteId}/settings`);
  return { saved: true };
}

export async function setScratchNoteEnabledAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  await requireSite(siteId);
  const enabled = formData.get("enabled") === "on";
  await upsertScratchNote(siteId, { enabled });
  revalidatePath(`/sites/${siteId}`);
  revalidatePath(`/sites/${siteId}/settings`);
}

// ---------------------------------------------------------------------------
// AI settings (per-user, shared across all of the user's sites)
// ---------------------------------------------------------------------------

export interface SaveAiSettingsState {
  error?: string;
  saved?: boolean;
}

export async function saveAiSettingsAction(
  _prev: SaveAiSettingsState,
  formData: FormData,
): Promise<SaveAiSettingsState> {
  const user = await requireUser();
  const baseUrl = String(formData.get("baseUrl") ?? "").trim().replace(/\/+$/, "");
  const model = String(formData.get("model") ?? "").trim();
  const apiKeyInput = String(formData.get("apiKey") ?? "").trim();

  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    return { error: actionError("needBaseUrl") };
  }
  if (!model) return { error: actionError("needModel") };

  // Leaving the key field blank on an already-configured account keeps the
  // existing key (the form never re-displays the decrypted key, so an empty
  // submit here means "unchanged", not "clear it").
  let apiKey = apiKeyInput;
  if (!apiKey) {
    const existing = await getAiConfig(user.id);
    if (!existing) return { error: actionError("needApiKey") };
    apiKey = existing.apiKey;
  }

  try {
    await saveAiConfig(user.id, { baseUrl, model, apiKey });
  } catch (error) {
    return { error: wrapCaughtError(error) };
  }

  revalidatePath("/account/ai");
  revalidatePath("/dashboard");
  return { saved: true };
}

export async function clearAiSettingsAction(): Promise<void> {
  const user = await requireUser();
  await deleteAiConfig(user.id);
  revalidatePath("/account/ai");
  revalidatePath("/dashboard");
}

export interface GenerateSummaryState {
  error?: string;
  summary?: string;
}

/** Called directly from the editor (not a `<form>`), so it can fill a field in place. */
export async function generateSummaryAction(
  siteId: string,
  body: string,
): Promise<GenerateSummaryState> {
  const { user } = await requireSite(siteId);
  if (!body.trim()) return { error: actionError("emptyBody") };
  const config = await getAiConfig(user.id);
  if (!config) return { error: actionError("needAiConfig") };
  try {
    const summary = await generateSummary(config, body);
    return { summary };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export interface GenerateDraftState {
  error?: string;
  draft?: string;
}

export async function generateDraftAction(
  siteId: string,
  prompt: string,
  options?: { tone?: DraftTone; length?: DraftLength },
): Promise<GenerateDraftState> {
  const { user } = await requireSite(siteId);
  if (!prompt.trim()) return { error: actionError("needPrompt") };
  const config = await getAiConfig(user.id);
  if (!config) return { error: actionError("needAiConfig") };
  try {
    const draft = await generateDraft(config, prompt, options);
    return { draft };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function hasAiConfigAction(siteId: string): Promise<boolean> {
  const { user } = await requireSite(siteId);
  return (await getAiConfig(user.id)) !== null;
}
