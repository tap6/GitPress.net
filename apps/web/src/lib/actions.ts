"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { githubInstallations, sites, themeListings } from "@/db/schema";
import { deleteAiConfig, generateDraft, generateSummary, getAiConfig, saveAiConfig } from "./ai";
import { persistSiteCategory, type SiteCategory } from "./categories";
import {
  deleteMedia,
  deletePost,
  getSiteConfig,
  parseTagList,
  saveSiteCategories,
  saveSiteNav,
  savePost,
  slugify,
  updatePostMeta,
  updateSiteConfig,
  uploadMedia,
} from "./content";
import { getInstallationOctokit, listBuildRuns, splitRepo, setPagesCustomDomain, putFile } from "./github";
import {
  MAX_BATCH_BYTES,
  MAX_BATCH_IMAGES,
  MAX_IMAGE_BYTES,
  sanitizeMediaFileName,
} from "./mediaName";
import { assertAllowedMediaUpload } from "./mediaTypes";
import { persistNavItem, type NavItem } from "./nav";
import { resolvePublicOrigin } from "./customDomain";
import { provisionSite, rotateDeployKey, triggerRebuild } from "./provision";
import { revalidateSiteData } from "./siteDataCache";
import { requireSite, requireUser } from "./sites";
import { getBuiltinTheme } from "./themes";
import {
  assertUsableThemeManifest,
  fetchGithubThemeManifest,
  formatGithubThemeSource,
  parseGithubThemeInput,
  parseGithubThemeSource,
  type GithubThemeRef,
  type RemoteThemeManifest,
} from "./themeSource";

// ---------------------------------------------------------------------------
// Site creation wizard
// ---------------------------------------------------------------------------

export interface CreateSiteState {
  error?: string;
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

  if (!name) return { error: "请填写站点名称。" };
  const slug = slugify(slugInput || name);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return { error: "标识符只能包含小写字母、数字和连字符。" };
  }
  if (!getBuiltinTheme(themeName)) return { error: "请选择一个主题。" };

  const [installation] = await db
    .select()
    .from(githubInstallations)
    .where(eq(githubInstallations.id, installationRowId))
    .limit(1);
  if (!installation || installation.userId !== user.id) {
    return { error: "请先连接 GitHub 账号。" };
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
        author: user.name ?? installation.accountLogin,
        themeName,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("name already exists")) {
      return { error: `仓库 ${slug} 或 ${slug}-data 已存在,请换一个标识符。` };
    }
    return { error: `初始化失败:${message}` };
  }

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

  redirect(`/sites/${row.id}?created=1`);
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
  if (!title) return { error: "请填写标题。" };
  const body = String(formData.get("body") ?? "");
  const date = String(formData.get("date") ?? "") || new Date().toISOString().slice(0, 10);
  const draft = formData.get("draft") === "on";
  const description = String(formData.get("description") ?? "").trim();
  const tags = parseTagList(String(formData.get("tags") ?? ""));
  const category = String(formData.get("category") ?? "").trim() || undefined;

  const existingPath = String(formData.get("path") ?? "");
  const isNew = !existingPath;
  const path = existingPath || `content/posts/${slugify(String(formData.get("slug") ?? "") || title)}.md`;

  const octokit = await getInstallationOctokit(installation.installationId);
  const mediaFiles = formData.getAll("media");
  const media: Array<{ name: string; base64: string }> = [];
  let batchBytes = 0;
  for (const file of mediaFiles) {
    if (!(file instanceof File) || file.size === 0) continue;
    if (!file.type.startsWith("image/")) {
      return { error: "只能随文章提交图片文件。" };
    }
    if (file.size > MAX_IMAGE_BYTES) return { error: "单个文件最大 8MB" };
    batchBytes += file.size;
    if (media.length >= MAX_BATCH_IMAGES) {
      return { error: `一次最多随文章提交 ${MAX_BATCH_IMAGES} 张图片。` };
    }
    if (batchBytes > MAX_BATCH_BYTES) return { error: "一次保存的图片合计不超过 20MB。" };
    const buffer = Buffer.from(await file.arrayBuffer());
    media.push({ name: sanitizeMediaFileName(file.name), base64: buffer.toString("base64") });
  }

  try {
    await savePost(
      octokit,
      site.dataRepo,
      path,
      { title, date, draft, tags, category, description, body },
      isNew,
      media,
    );
  } catch (error) {
    return { error: `保存失败:${error instanceof Error ? error.message : String(error)}` };
  }

  revalidateSiteData(site.dataRepo, [
    `/sites/${siteId}/posts`,
    `/sites/${siteId}`,
    `/sites/${siteId}/media`,
  ]);
  redirect(`/sites/${siteId}/posts?saved=1`);
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
  if (!title) return { error: "请填写标题。" };
  const date = String(formData.get("date") ?? "") || new Date().toISOString().slice(0, 10);
  const draft = String(formData.get("status") ?? "") === "draft";
  const tags = parseTagList(String(formData.get("tags") ?? ""));
  const categoryRaw = String(formData.get("category") ?? "").trim();

  const { site, installation } = await requireSite(siteId);
  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    await updatePostMeta(octokit, site.dataRepo, path, {
      title,
      date,
      draft,
      tags,
      category: categoryRaw || null,
    });
  } catch (error) {
    return { error: `保存失败:${error instanceof Error ? error.message : String(error)}` };
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
  if (paths.length === 0) return { error: "请先勾选文章。" };
  if (op !== "draft" && op !== "publish" && op !== "delete") {
    return { error: "未知操作。" };
  }

  const { site, installation } = await requireSite(siteId);
  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    if (op === "delete") {
      await Promise.all(paths.map((path) => deletePost(octokit, site.dataRepo, path)));
    } else {
      await Promise.all(
        paths.map((path) => updatePostMeta(octokit, site.dataRepo, path, { draft: op === "draft" })),
      );
    }
  } catch (error) {
    return { error: `操作失败:${error instanceof Error ? error.message : String(error)}` };
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
  if (file.size > 8 * 1024 * 1024) throw new Error("单个文件最大 8MB");
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
  if (!(file instanceof File) || file.size === 0) return { error: "请选择一张图片" };
  if (file.size > 8 * 1024 * 1024) return { error: "单个文件最大 8MB" };
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
  if (!getBuiltinTheme(themeName)) throw new Error("Unknown theme");

  const octokit = await getInstallationOctokit(installation.installationId);
  await updateSiteConfig(
    octokit,
    site.dataRepo,
    (config) => {
      config.theme.name = themeName;
      config.theme.source = "builtin";
      config.theme.ref = "v1";
    },
    `Switch theme to ${themeName}`,
  );
  await db.update(sites).set({ themeName, themeSource: "builtin" }).where(eq(sites.id, siteId));
  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/appearance`, `/sites/${siteId}`]);
}

async function persistImportedTheme(
  site: { id: string; dataRepo: string },
  installation: { installationId: number },
  source: string,
  parsed: GithubThemeRef,
  manifest: RemoteThemeManifest & { name: string },
): Promise<void> {
  const octokit = await getInstallationOctokit(installation.installationId);
  await updateSiteConfig(
    octokit,
    site.dataRepo,
    (config) => {
      config.theme.name = manifest.name;
      config.theme.source = source;
      config.theme.ref = parsed.ref;
      config.theme.config = {};
    },
    `Import theme ${manifest.name} from ${source}`,
  );
  await db
    .update(sites)
    .set({ themeName: manifest.name, themeConfig: {}, themeSource: source })
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
  if (Object.keys(properties).length === 0) throw new Error("无法读取该主题的选项定义");

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
  const { site, installation } = await requireSite(siteId);

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
  const manifest = await fetchGithubThemeManifest(source);
  if (!manifest) {
    return { error: "读不到 theme.json。请确认仓库公开,并且路径、分支或标签正确。" };
  }
  try {
    assertUsableThemeManifest(manifest);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  try {
    await persistImportedTheme(site, installation, source, parsed, manifest);
  } catch (error) {
    return { error: `导入失败:${error instanceof Error ? error.message : String(error)}` };
  }

  return { saved: true, name: manifest.name };
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
  if (!listing) throw new Error("该主题未上架或不存在。");

  const parsed = parseGithubThemeSource(listing.source);
  if (!parsed) throw new Error("目录里的主题地址无效。");

  const manifest = await fetchGithubThemeManifest(listing.source);
  if (!manifest) throw new Error("读不到 theme.json。主题仓库可能已改名或设为私有。");
  assertUsableThemeManifest(manifest);
  await persistImportedTheme(site, installation, listing.source, parsed, manifest);
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
    if (!parsed) return { error: `${stem} 图片无效,请重新裁剪后保存。` };
    if (parsed.bytes.length > MAX_IMAGE_BYTES) return { error: `${stem} 超过 8MB。` };
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
    return { error: "请先选择图片,或勾选移除。" };
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
    return { error: `保存失败:${error instanceof Error ? error.message : String(error)}` };
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
  if (!name) return { error: "请填写站点名称。" };
  const description = String(formData.get("description") ?? "").trim();
  const language = String(formData.get("language") ?? "en");
  const analyticsSnippet = String(formData.get("analyticsSnippet") ?? "").trim();

  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    await updateSiteConfig(
      octokit,
      site.dataRepo,
      (config) => {
        config.site.title = name;
        config.site.description = description;
        config.site.language = language;
        if (analyticsSnippet) {
          config.site.analyticsSnippet = analyticsSnippet;
        } else {
          delete config.site.analyticsSnippet;
        }
      },
      "Update site settings",
    );
  } catch (error) {
    return { error: `保存失败:${error instanceof Error ? error.message : String(error)}` };
  }

  await db.update(sites).set({ name, description, language }).where(eq(sites.id, siteId));
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
  if (err.status === 403) return "没有权限改这个仓库的 GitHub Pages 设置。";
  if (err.status === 422 || err.status === 400) {
    if (/taken|already in use/i.test(detail)) return "这个域名已被另一个 GitHub Pages 站点占用。";
    return detail ? `GitHub 拒绝了这个域名：${detail}` : "GitHub 拒绝了这个域名。";
  }
  return error instanceof Error ? error.message : "保存失败，请稍后再试。";
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
  redirect(`/sites/${siteId}/settings?domain=${notice}`);
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
  redirect(`/sites/${siteId}/settings?domain=unpages`);
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
      if (!label) throw new Error("分类名称不能为空");
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
    return { error: error instanceof Error ? error.message : "分类数据格式有误" };
  }

  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    await saveSiteCategories(octokit, site.dataRepo, categories);
  } catch (error) {
    return { error: `保存失败:${error instanceof Error ? error.message : String(error)}` };
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
          if (!slug) throw new Error("菜单中的分类项缺少 slug");
          return persistNavItem({ type: "category", slug, label: label || undefined });
        }
        case "page": {
          const slug = String(item.slug ?? "").trim();
          if (!slug) throw new Error("菜单中的页面项缺少 slug");
          return persistNavItem({ type: "page", slug, label: label || undefined });
        }
        case "link": {
          const url = String(item.url ?? "").trim();
          if (!url) throw new Error("自定义链接不能为空网址");
          if (!label) throw new Error("自定义链接需要填写名称");
          return persistNavItem({ type: "link", url, label });
        }
        default:
          throw new Error(`未知的菜单项类型:${String(item.type)}`);
      }
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "菜单数据格式有误" };
  }

  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    await saveSiteNav(octokit, site.dataRepo, nav);
  } catch (error) {
    return { error: `保存失败:${error instanceof Error ? error.message : String(error)}` };
  }

  revalidateSiteData(site.dataRepo, [`/sites/${siteId}/menu`]);
  return { saved: true };
}

export async function rebuildAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  await triggerRebuild(installation.installationId, site.dataRepo);
  revalidateSiteData(site.dataRepo, [`/sites/${siteId}`]);
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

export async function refreshGitHistoryAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  await requireSite(siteId);
  const page = Number.parseInt(String(formData.get("page") ?? "1"), 10) || 1;
  const path = page > 1 ? `/sites/${siteId}/history?page=${page}` : `/sites/${siteId}/history`;
  revalidatePath(`/sites/${siteId}/history`);
  redirect(path);
}

// ---------------------------------------------------------------------------
// Build status (polled by the sticky BuildStatusBar in the admin layout)
// ---------------------------------------------------------------------------

export interface BuildStatusSnapshot {
  status: "idle" | "queued" | "in_progress" | "success" | "failure" | "cancelled" | "unknown";
  runId?: number;
  createdAt?: string;
  htmlUrl?: string;
  commitMessage?: string | null;
  actionsPermissionMissing: boolean;
}

/**
 * Lightweight, frequently-polled snapshot of the data repo's latest GitHub
 * Actions run. Called directly from the client (not via a `<form>`) so it
 * can be hit on a timer without a full page navigation/refresh.
 */
export async function getBuildStatusAction(siteId: string): Promise<BuildStatusSnapshot> {
  const { site, installation } = await requireSite(siteId);
  const octokit = await getInstallationOctokit(installation.installationId);
  const { runs, actionsPermissionMissing } = await listBuildRuns(octokit, splitRepo(site.dataRepo));
  if (actionsPermissionMissing) {
    return { status: "unknown", actionsPermissionMissing: true };
  }
  const latest = runs[0];
  if (!latest) return { status: "idle", actionsPermissionMissing: false };
  if (latest.conclusion == null) {
    return {
      status: latest.status === "queued" ? "queued" : "in_progress",
      runId: latest.id,
      createdAt: latest.createdAt,
      htmlUrl: latest.htmlUrl,
      commitMessage: latest.commitMessage,
      actionsPermissionMissing: false,
    };
  }
  const status =
    latest.conclusion === "success"
      ? "success"
      : latest.conclusion === "failure"
        ? "failure"
        : "cancelled";
  return {
    status,
    runId: latest.id,
    createdAt: latest.createdAt,
    htmlUrl: latest.htmlUrl,
    commitMessage: latest.commitMessage,
    actionsPermissionMissing: false,
  };
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
    return { error: "请填写有效的 Base URL(以 http(s):// 开头)。" };
  }
  if (!model) return { error: "请填写模型名称。" };

  // Leaving the key field blank on an already-configured account keeps the
  // existing key (the form never re-displays the decrypted key, so an empty
  // submit here means "unchanged", not "clear it").
  let apiKey = apiKeyInput;
  if (!apiKey) {
    const existing = await getAiConfig(user.id);
    if (!existing) return { error: "请填写 API Key。" };
    apiKey = existing.apiKey;
  }

  try {
    await saveAiConfig(user.id, { baseUrl, model, apiKey });
  } catch (error) {
    return { error: `保存失败:${error instanceof Error ? error.message : String(error)}` };
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
  if (!body.trim()) return { error: "正文还是空的,先写点什么吧。" };
  const config = await getAiConfig(user.id);
  if (!config) return { error: "还没有配置 AI,请先前往「AI 设置」。" };
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
): Promise<GenerateDraftState> {
  const { user } = await requireSite(siteId);
  if (!prompt.trim()) return { error: "请先填写主题或要点。" };
  const config = await getAiConfig(user.id);
  if (!config) return { error: "还没有配置 AI,请先前往「AI 设置」。" };
  try {
    const draft = await generateDraft(config, prompt);
    return { draft };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function hasAiConfigAction(siteId: string): Promise<boolean> {
  const { user } = await requireSite(siteId);
  return (await getAiConfig(user.id)) !== null;
}
