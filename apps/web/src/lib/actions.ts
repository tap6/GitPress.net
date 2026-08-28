"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { githubInstallations, sites } from "@/db/schema";
import { deleteAiConfig, generateDraft, generateSummary, getAiConfig, saveAiConfig } from "./ai";
import {
  deleteMedia,
  deletePost,
  parseTagList,
  saveSiteCategories,
  savePost,
  slugify,
  type SiteCategory,
  updatePostMeta,
  updateSiteConfig,
  uploadMedia,
} from "./content";
import { getInstallationOctokit, listBuildRuns, splitRepo } from "./github";
import { provisionSite, rotateDeployKey, triggerRebuild } from "./provision";
import { requireSite, requireUser } from "./sites";
import { getBuiltinTheme } from "./themes";

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
  try {
    await savePost(
      octokit,
      site.dataRepo,
      path,
      { title, date, draft, tags, category, description, body },
      isNew,
    );
  } catch (error) {
    return { error: `保存失败:${error instanceof Error ? error.message : String(error)}` };
  }

  revalidatePath(`/sites/${siteId}/posts`);
  redirect(`/sites/${siteId}/posts?saved=1`);
}

export async function deletePostAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const path = String(formData.get("path"));
  const { site, installation } = await requireSite(siteId);
  if (!path.startsWith("content/posts/")) throw new Error("Invalid path");
  const octokit = await getInstallationOctokit(installation.installationId);
  await deletePost(octokit, site.dataRepo, path);
  revalidatePath(`/sites/${siteId}/posts`);
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
  revalidatePath(`/sites/${siteId}/posts`);
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
  revalidatePath(`/sites/${siteId}/posts`);
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
  const buffer = Buffer.from(await file.arrayBuffer());
  const octokit = await getInstallationOctokit(installation.installationId);
  await uploadMedia(octokit, site.dataRepo, file.name, buffer.toString("base64"));
  revalidatePath(`/sites/${siteId}/media`);
}

export interface UploadEditorImageState {
  url?: string;
  error?: string;
}

/**
 * Same upload as `uploadMediaAction`, but called directly from client code
 * (not a `<form>` submission) so the rich text editor can insert the
 * resulting `/media/...` path as an <img> the moment the upload finishes.
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
  return { url };
}

export async function deleteMediaAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const path = String(formData.get("path"));
  const { site, installation } = await requireSite(siteId);
  if (!path.startsWith("media/")) throw new Error("Invalid path");
  const octokit = await getInstallationOctokit(installation.installationId);
  await deleteMedia(octokit, site.dataRepo, path);
  revalidatePath(`/sites/${siteId}/media`);
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
  await db.update(sites).set({ themeName }).where(eq(sites.id, siteId));
  revalidatePath(`/sites/${siteId}/appearance`);
}

export async function saveThemeOptionsAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  const theme = getBuiltinTheme(site.themeName);
  if (!theme) throw new Error("Unknown theme");

  const config: Record<string, unknown> = {};
  for (const option of theme.options) {
    const raw = formData.get(`opt_${option.key}`);
    config[option.key] = option.type === "boolean" ? raw === "on" : String(raw ?? option.defaultValue);
  }

  const octokit = await getInstallationOctokit(installation.installationId);
  await updateSiteConfig(
    octokit,
    site.dataRepo,
    (cfg) => {
      cfg.theme.config = { ...(cfg.theme.config ?? {}), ...config };
    },
    "Update theme options",
  );
  await db.update(sites).set({ themeConfig: config }).where(eq(sites.id, siteId));
  revalidatePath(`/sites/${siteId}/appearance`);
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
  revalidatePath(`/sites/${siteId}/settings`);
  return { saved: true };
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
      return { slug, label };
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

  revalidatePath(`/sites/${siteId}/categories`);
  revalidatePath(`/sites/${siteId}/posts`);
  return { saved: true };
}

export async function rebuildAction(formData: FormData): Promise<void> {
  const siteId = String(formData.get("siteId"));
  const { site, installation } = await requireSite(siteId);
  await triggerRebuild(installation.installationId, site.dataRepo);
  revalidatePath(`/sites/${siteId}`);
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
  revalidatePath(`/sites/${siteId}`);
  revalidatePath(`/sites/${siteId}/settings`);
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
