"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { githubInstallations, sites } from "@/db/schema";
import {
  deleteMedia,
  deletePost,
  savePost,
  slugify,
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
  const tags = String(formData.get("tags") ?? "")
    .split(/[,,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const existingPath = String(formData.get("path") ?? "");
  const isNew = !existingPath;
  const path = existingPath || `content/posts/${slugify(String(formData.get("slug") ?? "") || title)}.md`;

  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    await savePost(octokit, site.dataRepo, path, { title, date, draft, tags, description, body }, isNew);
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
  revalidatePath(`/sites/${siteId}/media`);
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

  const octokit = await getInstallationOctokit(installation.installationId);
  try {
    await updateSiteConfig(
      octokit,
      site.dataRepo,
      (config) => {
        config.site.title = name;
        config.site.description = description;
        config.site.language = language;
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
    actionsPermissionMissing: false,
  };
}
