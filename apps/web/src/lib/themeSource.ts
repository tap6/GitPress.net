import type { ThemeConfigSchema } from "./themes";

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
  if (!s) throw new Error("请填写 GitHub 仓库。");
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
  if (segments.length < 2) throw new Error("仓库格式应为 owner/repo,或完整的 GitHub 链接。");
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
  engine?: string;
  configSchema?: ThemeConfigSchema;
}

function themeJsonUrl(ref: GithubThemeRef): string {
  const path = ref.subdir ? `${ref.subdir}/theme.json` : "theme.json";
  return `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${ref.ref}/${path}`;
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
    throw new Error(`该主题 specVersion 为 ${String(manifest.specVersion)},当前平台只支持 1。`);
  }
  if (manifest.engine !== "astro") {
    throw new Error(`该主题 engine 为 ${String(manifest.engine)},当前只支持 astro。`);
  }
  if (!manifest.name || typeof manifest.name !== "string") {
    throw new Error("theme.json 缺少 name。");
  }
}
