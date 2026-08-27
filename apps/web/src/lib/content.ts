import matter from "gray-matter";
import type { Octokit } from "octokit";
import { deleteFile, getFileText, listDirectory, putFile, splitRepo } from "./github";

/** Content operations = commits against the private data repository. */

export interface PostSummary {
  /** Repo path, e.g. content/posts/hello-world.md */
  path: string;
  file: string;
  title: string;
  date: string | null;
  draft: boolean;
  tags: string[];
  description: string;
}

export interface PostDetail extends PostSummary {
  body: string;
  sha: string;
}

export async function listPosts(octokit: Octokit, dataRepo: string): Promise<PostSummary[]> {
  const ref = splitRepo(dataRepo);
  const files = await listDirectory(octokit, ref, "content/posts");
  const posts: PostSummary[] = [];
  for (const file of files) {
    if (!file.name.endsWith(".md")) continue;
    const raw = await getFileText(octokit, ref, file.path);
    if (!raw) continue;
    posts.push(summarize(file.path, file.name, raw.text));
  }
  return posts.sort((a, b) => (b.date ?? "9999").localeCompare(a.date ?? "9999"));
}

function summarize(path: string, file: string, text: string): PostSummary {
  const { data } = matter(text);
  return {
    path,
    file,
    title: typeof data.title === "string" ? data.title : file.replace(/\.md$/, ""),
    date: data.date ? String(data.date).slice(0, 10) : null,
    draft: data.draft === true,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    description: typeof data.description === "string" ? data.description : "",
  };
}

export async function getPost(
  octokit: Octokit,
  dataRepo: string,
  path: string,
): Promise<PostDetail | null> {
  const ref = splitRepo(dataRepo);
  const raw = await getFileText(octokit, ref, path);
  if (!raw) return null;
  const parsed = matter(raw.text);
  const summary = summarize(path, path.split("/").pop() ?? path, raw.text);
  return { ...summary, body: parsed.content.replace(/^\n/, ""), sha: raw.sha };
}

export interface SavePostInput {
  title: string;
  date: string;
  draft: boolean;
  tags: string[];
  description: string;
  body: string;
}

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `post-${Date.now()}`;
}

export async function savePost(
  octokit: Octokit,
  dataRepo: string,
  path: string,
  input: SavePostInput,
  isNew: boolean,
): Promise<void> {
  const frontmatter: Record<string, unknown> = {
    title: input.title,
    date: input.date,
  };
  if (input.draft) frontmatter.draft = true;
  if (input.tags.length > 0) frontmatter.tags = input.tags;
  if (input.description) frontmatter.description = input.description;

  const text = matter.stringify(`\n${input.body.trim()}\n`, frontmatter);
  await putFile(
    octokit,
    splitRepo(dataRepo),
    path,
    { utf8: text },
    `${isNew ? "Add" : "Update"} post: ${input.title}`,
  );
}

export async function deletePost(octokit: Octokit, dataRepo: string, path: string): Promise<void> {
  await deleteFile(octokit, splitRepo(dataRepo), path, `Delete post: ${path}`);
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export interface MediaItem {
  path: string;
  name: string;
  size: number;
  downloadUrl: string | null;
}

export async function listMedia(octokit: Octokit, dataRepo: string): Promise<MediaItem[]> {
  const files = await listDirectory(octokit, splitRepo(dataRepo), "media");
  return files
    .filter((file) => file.name !== ".gitkeep")
    .map((file) => ({
      path: file.path,
      name: file.name,
      size: file.size,
      downloadUrl: file.downloadUrl,
    }));
}

export async function uploadMedia(
  octokit: Octokit,
  dataRepo: string,
  fileName: string,
  base64: string,
): Promise<string> {
  const safeName = fileName.replace(/[^\w.\-]+/g, "-");
  const path = `media/${safeName}`;
  await putFile(octokit, splitRepo(dataRepo), path, { base64 }, `Upload media: ${safeName}`);
  return `/${path}`;
}

export async function deleteMedia(
  octokit: Octokit,
  dataRepo: string,
  path: string,
): Promise<void> {
  await deleteFile(octokit, splitRepo(dataRepo), path, `Delete media: ${path}`);
}

// ---------------------------------------------------------------------------
// Site configuration (gitpress.json)
// ---------------------------------------------------------------------------

export interface SiteConfig {
  schemaVersion: number;
  site: Record<string, unknown> & { title?: string };
  theme: Record<string, unknown> & { name?: string; config?: Record<string, unknown> };
  [key: string]: unknown;
}

export async function getSiteConfig(
  octokit: Octokit,
  dataRepo: string,
): Promise<SiteConfig | null> {
  const raw = await getFileText(octokit, splitRepo(dataRepo), "gitpress.json");
  if (!raw) return null;
  try {
    return JSON.parse(raw.text) as SiteConfig;
  } catch {
    return null;
  }
}

/**
 * Non-destructive config update: read-modify-write that preserves any fields
 * we do not know about (forward compatibility with future schema additions).
 */
export async function updateSiteConfig(
  octokit: Octokit,
  dataRepo: string,
  mutate: (config: SiteConfig) => void,
  message: string,
): Promise<SiteConfig> {
  const config = (await getSiteConfig(octokit, dataRepo)) ?? {
    schemaVersion: 1,
    site: { title: "My Site" },
    theme: { name: "classic", source: "builtin", ref: "v1", config: {} },
  };
  mutate(config);
  await putFile(
    octokit,
    splitRepo(dataRepo),
    "gitpress.json",
    { utf8: `${JSON.stringify(config, null, 2)}\n` },
    message,
  );
  return config;
}
