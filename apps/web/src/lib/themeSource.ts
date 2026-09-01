import type { ThemeConfigSchema } from "./themes";
import { actionError } from "./actionError";

/**
 * Parsed `github:<owner>/<repo>[/<subdir>]#<ref>` (see @gitpress/spec ThemeRef.source).
 */
export interface GithubThemeRef {
  owner: string;
  repo: string;
  subdir: string;
  ref: string;
}

export function formatGithubThemeSource(ref: GithubThemeRef): string {
  const path = ref.subdir ? `${ref.owner}/${ref.repo}/${ref.subdir}` : `${ref.owner}/${ref.repo}`;
  return `github:${path}#${ref.ref}`;
}

export function parseGithubThemeSource(source: string): GithubThemeRef | null {
  const raw = source.trim();
  if (!raw.toLowerCase().startsWith("github:")) return null;
  const spec = raw.slice("github:".length);
  const hash = spec.indexOf("#");
  const repoPath = (hash >= 0 ? spec.slice(0, hash) : spec).replace(/^\/+|\/+$/g, "");
  const ref = (hash >= 0 ? spec.slice(hash + 1) : "").trim();
  const segments = repoPath.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  return {
    owner: segments[0],
    repo: segments[1],
    subdir: segments.slice(2).join("/"),
    ref: ref || "v1",
  };
}

/**
 * Accepts `owner/repo`, full github.com URLs (including `/tree/<branch>/…`),
 * or an already-normalized `github:` source.
 */
export function parseGithubThemeInput(raw: string, subdirInput = "", refInput = ""): GithubThemeRef {
  let s = raw.trim();
  if (!s) throw new Error(actionError("fillGithubRepo"));
  s = s.replace(/^https?:\/\//i, "");
  s = s.replace(/^(www\.)?github\.com\//i, "");
  s = s.replace(/\.git$/i, "");
  s = s.replace(/^github:/i, "");
  s = s.replace(/\/+$/, "");

  let ref = refInput.trim();
  const hash = s.indexOf("#");
  if (hash >= 0) {
    ref = s.slice(hash + 1).trim() || ref;
    s = s.slice(0, hash);
  }

  const treeMatch = s.match(/^([^/]+)\/([^/]+)\/tree\/([^/]+)(?:\/(.*))?$/);
  if (treeMatch) {
    const subdir = (subdirInput.trim() || treeMatch[4] || "").replace(/^\/+|\/+$/g, "");
    return {
      owner: treeMatch[1],
      repo: treeMatch[2],
      subdir,
      ref: ref || treeMatch[3] || "v1",
    };
  }

  const blobMatch = s.match(/^([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.*)$/);
  if (blobMatch) {
    const blobPath = blobMatch[4].replace(/\/theme\.json$/i, "");
    const subdir = (subdirInput.trim() || blobPath).replace(/^\/+|\/+$/g, "");
    return {
      owner: blobMatch[1],
      repo: blobMatch[2],
      subdir,
      ref: ref || blobMatch[3] || "v1",
    };
  }

  const segments = s.split("/").filter(Boolean);
  if (segments.length < 2) throw new Error(actionError("repoFormat"));
  const fromUrlSubdir = segments.slice(2).join("/");
  const subdir = (subdirInput.trim() || fromUrlSubdir).replace(/^\/+|\/+$/g, "");
  return {
    owner: segments[0],
    repo: segments[1],
    subdir,
    ref: ref || "v1",
  };
}

export function githubThemePageUrl(ref: GithubThemeRef): string {
  const base = `https://github.com/${ref.owner}/${ref.repo}`;
  if (ref.subdir) return `${base}/tree/${encodeURIComponent(ref.ref)}/${ref.subdir}`;
  return `${base}/tree/${encodeURIComponent(ref.ref)}`;
}

export interface RemoteThemeManifest {
  specVersion?: number;
  name?: string;
  displayName?: string;
  description?: string;
  author?: string;
  version?: string;
  license?: string;
  homepage?: string;
  engine?: string;
  preview?: string;
  tags?: string[];
  configSchema?: ThemeConfigSchema;
}

/** Cached card fields written to Neon (catalog + per-site library). */
export interface ThemeCardCache {
  name: string;
  displayName: string;
  author: string;
  description: string;
  preview: string;
  version: string;
  license: string;
  homepage: string;
}

export function themeCardCacheFromManifest(
  source: string,
  manifest: RemoteThemeManifest & { name: string },
): ThemeCardCache {
  const parsed = parseGithubThemeSource(source);
  return {
    name: manifest.name,
    displayName: manifest.displayName?.trim() || manifest.name,
    author: manifest.author?.trim() || parsed?.owner || "",
    description: manifest.description?.trim() || "",
    preview: manifest.preview?.trim() || "preview.svg",
    version: manifest.version?.trim() || "",
    license: manifest.license?.trim() || "",
    homepage: manifest.homepage?.trim() || "",
  };
}

function githubRawFileUrl(ref: GithubThemeRef, filePath: string): string | null {
  const file = filePath.replace(/^\/+/, "").trim();
  if (!file || file.includes("..") || file.includes("\\") || file.includes("\0")) return null;
  const full = ref.subdir ? `${ref.subdir}/${file}` : file;
  if (full.split("/").some((segment) => segment === "..")) return null;
  return `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${ref.ref}/${full}`;
}

function themeJsonUrl(ref: GithubThemeRef): string {
  return githubRawFileUrl(ref, "theme.json") ?? "";
}

/** Public raw URL for a file inside a GitHub theme package (preview.svg, etc.). */
export function githubThemeFileUrl(source: string, filePath: string): string | null {
  const ref = parseGithubThemeSource(source);
  if (!ref) return null;
  return githubRawFileUrl(ref, filePath);
}

export function githubThemePreviewUrl(source: string, previewPath?: string): string | null {
  return githubThemeFileUrl(source, previewPath?.trim() || "preview.svg");
}

export async function fetchGithubThemeManifest(source: string): Promise<RemoteThemeManifest | null> {
  const ref = parseGithubThemeSource(source);
  if (!ref) return null;
  try {
    const response = await fetch(themeJsonUrl(ref), { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as RemoteThemeManifest;
  } catch {
    return null;
  }
}

export function assertUsableThemeManifest(manifest: RemoteThemeManifest): asserts manifest is RemoteThemeManifest & {
  name: string;
} {
  if (manifest.specVersion !== 1) {
    throw new Error(actionError("specVersion", { v: String(manifest.specVersion) }));
  }
  if (manifest.engine !== "astro") {
    throw new Error(actionError("engine", { v: String(manifest.engine) }));
  }
  if (!manifest.name || typeof manifest.name !== "string") {
    throw new Error(actionError("themeNameMissing"));
  }
}
