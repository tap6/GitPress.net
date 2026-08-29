import { cache } from "react";
import { App, Octokit } from "octokit";
import { randomBytes } from "node:crypto";
import nacl from "tweetnacl";
import { blake2b } from "blakejs";
import { mediaContentType } from "./mediaTypes";

// ---------------------------------------------------------------------------
// GitHub App plumbing
// ---------------------------------------------------------------------------

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

let appSingleton: App | undefined;

export function getGitHubApp(): App {
  if (!appSingleton) {
    appSingleton = new App({
      appId: requiredEnv("GITHUB_APP_ID"),
      privateKey: requiredEnv("GITHUB_APP_PRIVATE_KEY").replaceAll("\\n", "\n"),
    });
  }
  return appSingleton;
}

export function githubAppInstallUrl(): string {
  return `https://github.com/apps/${requiredEnv("GITHUB_APP_SLUG")}/installations/new`;
}

const PERMISSION_RANK: Record<string, number> = { read: 1, write: 2, admin: 3 };

const PERMISSION_LABELS: Record<string, string> = {
  actions: "Actions(读取构建记录)",
  administration: "仓库管理",
  contents: "仓库内容",
  metadata: "元数据",
  pages: "GitHub Pages",
  secrets: "Actions Secrets",
  workflows: "工作流文件",
};

function permissionLabel(name: string): string {
  return PERMISSION_LABELS[name] ?? name;
}

function asPermissionMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const map: Record<string, string> = {};
  for (const [key, level] of Object.entries(value as Record<string, unknown>)) {
    if (typeof level === "string" && level in PERMISSION_RANK) map[key] = level;
  }
  return map;
}

/** App-level requested permissions (JWT). Memoized per request. */
const getRequestedAppPermissions = cache(async (): Promise<Record<string, string>> => {
  const app = getGitHubApp();
  const { data } = await app.octokit.request("GET /app");
  return asPermissionMap(data?.permissions);
});

export interface PermissionGap {
  installationId: number;
  accountLogin: string;
  /** GitHub's own "Configure installation" page — the only place new scopes can be accepted. */
  reviewUrl: string;
  missing: Array<{ name: string; label: string; requested: string; granted: string | null }>;
}

/**
 * Compare the App's currently requested permissions with what this installation
 * has actually granted. GitHub never auto-upgrades existing installs: the
 * account owner must click through github.com. Until they do, new scopes
 * (e.g. Actions) simply 403 — which is why users on gitpress.net see no
 * "permission update request" after we change the App on our side.
 */
export const getInstallationPermissionGap = cache(
  async (installationId: number): Promise<PermissionGap | null> => {
    try {
      const app = getGitHubApp();
      const [requested, installation] = await Promise.all([
        getRequestedAppPermissions(),
        app.octokit.request("GET /app/installations/{installation_id}", {
          installation_id: installationId,
        }),
      ]);
      const granted = asPermissionMap(installation.data.permissions);
      const missing: PermissionGap["missing"] = [];
      for (const [name, requestedLevel] of Object.entries(requested)) {
        const grantedLevel = granted[name];
        if ((PERMISSION_RANK[grantedLevel] ?? 0) < (PERMISSION_RANK[requestedLevel] ?? 0)) {
          missing.push({
            name,
            label: permissionLabel(name),
            requested: requestedLevel,
            granted: grantedLevel ?? null,
          });
        }
      }
      if (missing.length === 0) return null;
      const account = installation.data.account as { login?: string; slug?: string } | null;
      return {
        installationId,
        accountLogin: account?.login ?? account?.slug ?? "GitHub",
        reviewUrl:
          installation.data.html_url ||
          `https://github.com/settings/installations/${installationId}`,
        missing,
      };
    } catch {
      return null;
    }
  },
);

export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
  return getGitHubApp().getInstallationOctokit(installationId);
}

export interface InstallationInfo {
  installationId: number;
  accountLogin: string;
  accountType: string;
}

export async function fetchInstallationInfo(installationId: number): Promise<InstallationInfo> {
  const app = getGitHubApp();
  const { data } = await app.octokit.request("GET /app/installations/{installation_id}", {
    installation_id: installationId,
  });
  const account = data.account as { login?: string; type?: string; slug?: string } | null;
  return {
    installationId,
    accountLogin: account?.login ?? account?.slug ?? "unknown",
    accountType: account?.type ?? "User",
  };
}

/** Exchange the OAuth-on-install `code` for a user-to-server token. */
export async function exchangeOAuthCode(
  code: string,
): Promise<{ accessToken: string; refreshToken?: string } | null> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requiredEnv("GITHUB_APP_CLIENT_ID"),
      client_secret: requiredEnv("GITHUB_APP_CLIENT_SECRET"),
      code,
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
  };
  if (!data.access_token) return null;
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

// ---------------------------------------------------------------------------
// Repository operations
// ---------------------------------------------------------------------------

export interface RepoRef {
  owner: string;
  repo: string;
}

export function splitRepo(fullName: string): RepoRef {
  const [owner, repo] = fullName.split("/");
  return { owner, repo };
}

export interface RepoCommit {
  sha: string;
  shortSha: string;
  message: string;
  committedAt: string;
  htmlUrl: string;
  authorLogin: string | null;
  authorName: string | null;
  authorAvatarUrl: string | null;
}

export interface RepoCommitList {
  commits: RepoCommit[];
  page: number;
  perPage: number;
  lastPage: number | null;
  hasNext: boolean;
  hasPrev: boolean;
  error: string | null;
}

function linkHasRel(linkHeader: string | undefined, rel: string): boolean {
  if (!linkHeader) return false;
  return linkHeader.split(",").some((part) => part.includes(`rel="${rel}"`));
}

function linkPage(linkHeader: string | undefined, rel: string): number | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",")) {
    if (!part.includes(`rel="${rel}"`)) continue;
    const match = part.match(/[?&]page=(\d+)/);
    if (match) return Number(match[1]);
  }
  return null;
}

function emptyCommitList(
  page: number,
  perPage: number,
  extra: Partial<Pick<RepoCommitList, "hasPrev" | "error">> = {},
): RepoCommitList {
  return {
    commits: [],
    page,
    perPage,
    lastPage: page,
    hasNext: false,
    hasPrev: extra.hasPrev ?? page > 1,
    error: extra.error ?? null,
  };
}

/**
 * Recent commits on the default branch. Uses Contents (already granted),
 * not Actions — this is the actual git history, not workflow runs.
 */
export async function listRepoCommits(
  octokit: Octokit,
  ref: RepoRef,
  options: { page?: number; perPage?: number } = {},
): Promise<RepoCommitList> {
  const page = Math.max(1, options.page ?? 1);
  const perPage = options.perPage ?? 25;
  try {
    const response = await octokit.request("GET /repos/{owner}/{repo}/commits", {
      ...ref,
      page,
      per_page: perPage,
    });
    const link = typeof response.headers.link === "string" ? response.headers.link : "";
    const hasNext = linkHasRel(link, "next");
    return {
      commits: response.data.map((item) => ({
        sha: item.sha,
        shortSha: item.sha.slice(0, 7),
        message: item.commit.message,
        committedAt:
          item.commit.committer?.date ?? item.commit.author?.date ?? new Date().toISOString(),
        htmlUrl: item.html_url,
        authorLogin: item.author?.login ?? item.committer?.login ?? null,
        authorName: item.commit.author?.name ?? item.commit.committer?.name ?? null,
        authorAvatarUrl: item.author?.avatar_url ?? item.committer?.avatar_url ?? null,
      })),
      page,
      perPage,
      lastPage: linkPage(link, "last") ?? (hasNext ? null : page),
      hasNext,
      hasPrev: page > 1,
      error: null,
    };
  } catch (error: unknown) {
    const status = (error as { status?: number }).status;
    // Empty repos return 409 Conflict.
    if (status === 409) return emptyCommitList(page, perPage);
    console.error("listRepoCommits failed:", error);
    const message =
      status === 403
        ? "没有权限读取这个仓库的提交记录。"
        : status === 404
          ? "找不到数据仓库。"
          : "暂时无法读取 Git 记录，请稍后再试。";
    return emptyCommitList(page, perPage, { error: message });
  }
}

/**
 * Create a repository on the installation account.
 * Personal accounts require the user-to-server token (POST /user/repos);
 * organizations can use the installation token.
 */
export async function createRepository(options: {
  octokit: Octokit;
  accountLogin: string;
  accountType: string;
  userToken?: string | null;
  name: string;
  description: string;
  isPrivate: boolean;
  autoInit: boolean;
}): Promise<void> {
  const { octokit, accountLogin, accountType, userToken, name, description, isPrivate, autoInit } =
    options;
  if (accountType === "Organization") {
    await octokit.request("POST /orgs/{org}/repos", {
      org: accountLogin,
      name,
      description,
      private: isPrivate,
      auto_init: autoInit,
    });
    return;
  }
  if (!userToken) {
    throw new Error(
      "Creating repositories on a personal account requires GitHub user authorization. Please reconnect GitHub.",
    );
  }
  const userOctokit = new Octokit({ auth: userToken });
  await userOctokit.request("POST /user/repos", {
    name,
    description,
    private: isPrivate,
    auto_init: autoInit,
  });
}

/** Create or update a single file (one commit per call). */
export async function putFile(
  octokit: Octokit,
  ref: RepoRef,
  path: string,
  contentUtf8OrBase64: { utf8?: string; base64?: string },
  message: string,
): Promise<void> {
  const content =
    contentUtf8OrBase64.base64 ??
    Buffer.from(contentUtf8OrBase64.utf8 ?? "", "utf8").toString("base64");
  let sha: string | undefined;
  try {
    const existing = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      ...ref,
      path,
    });
    if (!Array.isArray(existing.data) && existing.data.type === "file") {
      sha = existing.data.sha;
    }
  } catch {
    // File does not exist yet.
  }
  await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
    ...ref,
    path,
    message,
    content,
    sha,
  });
}

export interface CommitFile {
  path: string;
  utf8?: string;
  base64?: string;
}

/**
 * One git commit containing many files (Git Data API: blobs + tree + commit).
 * The Contents API is one-file-per-commit, which would fire a GitHub Actions
 * run for every image; batching means N images + the post become a single
 * `on: push` build.
 */
export async function commitFiles(
  octokit: Octokit,
  ref: RepoRef,
  files: CommitFile[],
  message: string,
): Promise<void> {
  const meaningful = files.filter((file) => file.utf8 != null || file.base64 != null);
  if (meaningful.length === 0) return;
  if (meaningful.length === 1) {
    const [file] = meaningful;
    await putFile(octokit, ref, file.path, file, message);
    return;
  }

  const { data: repo } = await octokit.request("GET /repos/{owner}/{repo}", { ...ref });
  const branch = repo.default_branch || "main";
  const { data: head } = await octokit.request("GET /repos/{owner}/{repo}/git/ref/{ref}", {
    ...ref,
    ref: `heads/${branch}`,
  });
  const parentSha = head.object.sha;
  const { data: parent } = await octokit.request("GET /repos/{owner}/{repo}/git/commits/{commit_sha}", {
    ...ref,
    commit_sha: parentSha,
  });

  const tree = await Promise.all(
    meaningful.map(async (file) => {
      const content =
        file.base64 ?? Buffer.from(file.utf8 ?? "", "utf8").toString("base64");
      const { data: blob } = await octokit.request("POST /repos/{owner}/{repo}/git/blobs", {
        ...ref,
        content,
        encoding: "base64",
      });
      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    }),
  );

  const { data: newTree } = await octokit.request("POST /repos/{owner}/{repo}/git/trees", {
    ...ref,
    base_tree: parent.tree.sha,
    tree,
  });
  const { data: commit } = await octokit.request("POST /repos/{owner}/{repo}/git/commits", {
    ...ref,
    message,
    tree: newTree.sha,
    parents: [parentSha],
  });
  await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/{ref}", {
    ...ref,
    ref: `heads/${branch}`,
    sha: commit.sha,
  });
}

export interface RepoFile {
  path: string;
  name: string;
  sha: string;
  size: number;
  downloadUrl: string | null;
}

export async function listDirectory(
  octokit: Octokit,
  ref: RepoRef,
  path: string,
): Promise<RepoFile[]> {
  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      ...ref,
      path,
    });
    if (!Array.isArray(data)) return [];
    return data
      .filter((entry) => entry.type === "file")
      .map((entry) => ({
        path: entry.path,
        name: entry.name,
        sha: entry.sha,
        size: entry.size,
        downloadUrl: entry.download_url ?? null,
      }));
  } catch {
    return [];
  }
}

export async function getFileText(
  octokit: Octokit,
  ref: RepoRef,
  path: string,
): Promise<{ text: string; sha: string } | null> {
  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      ...ref,
      path,
    });
    if (Array.isArray(data) || data.type !== "file") return null;
    return {
      text: Buffer.from(data.content, "base64").toString("utf8"),
      sha: data.sha,
    };
  } catch {
    return null;
  }
}

/** Read a binary file (images/videos) from a repo. Prefer git blob sha when known. */
export async function getFileBinary(
  octokit: Octokit,
  ref: RepoRef,
  path: string,
  sha?: string,
): Promise<{ bytes: Buffer; contentType: string; sha: string } | null> {
  try {
    if (sha) {
      const blob = await readGitBlob(octokit, ref, sha, path);
      if (blob) return blob;
    }
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      ...ref,
      path,
    });
    if (Array.isArray(data) || data.type !== "file") return null;
    const contentType = mediaContentType(data.name);
    if (typeof data.content === "string" && data.content.length > 0) {
      return {
        bytes: Buffer.from(data.content.replace(/\n/g, ""), "base64"),
        contentType,
        sha: data.sha,
      };
    }
    // Files > 1MB are not inlined; the contents payload still has the blob sha.
    return readGitBlob(octokit, ref, data.sha, path);
  } catch {
    return null;
  }
}

async function readGitBlob(
  octokit: Octokit,
  ref: RepoRef,
  sha: string,
  path: string,
): Promise<{ bytes: Buffer; contentType: string; sha: string } | null> {
  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/git/blobs/{file_sha}", {
      ...ref,
      file_sha: sha,
    });
    if (typeof data.content !== "string") return null;
    const bytes =
      data.encoding === "base64"
        ? Buffer.from(data.content.replace(/\n/g, ""), "base64")
        : Buffer.from(data.content, "utf8");
    return { bytes, contentType: mediaContentType(path), sha: data.sha };
  } catch {
    return null;
  }
}

export async function deleteFile(
  octokit: Octokit,
  ref: RepoRef,
  path: string,
  message: string,
): Promise<void> {
  const existing = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
    ...ref,
    path,
  });
  if (Array.isArray(existing.data) || existing.data.type !== "file") {
    throw new Error(`Not a file: ${path}`);
  }
  await octokit.request("DELETE /repos/{owner}/{repo}/contents/{path}", {
    ...ref,
    path,
    message,
    sha: existing.data.sha,
  });
}

// ---------------------------------------------------------------------------
// Deploy keys, Actions secrets, Pages
// ---------------------------------------------------------------------------

/**
 * Generate an ed25519 keypair as a real OpenSSH-formatted deploy key.
 *
 * IMPORTANT: OpenSSH's ssh/ssh-keygen only accept ed25519 private keys in the
 * native "openssh-key-v1" container — it does NOT accept generic PKCS8 PEM for
 * this key type ("Load key ...: invalid format"). Node's crypto module can
 * only export PKCS8, so we build the OpenSSH v1 blob by hand (unencrypted,
 * cipher/kdf "none") per PROTOCOL.key. This is what actually lets the build
 * action authenticate over SSH when pushing the compiled site.
 */
export function generateDeployKeyPair(): { privatePem: string; publicOpenSsh: string } {
  const { publicKey, secretKey } = nacl.sign.keyPair();
  const pub = Buffer.from(publicKey); // 32 bytes
  const priv = Buffer.from(secretKey); // 64 bytes: 32-byte seed + 32-byte pubkey
  const keyType = Buffer.from("ssh-ed25519", "ascii");

  const pubWire = Buffer.concat([sshString(keyType), sshString(pub)]);
  const publicOpenSsh = `ssh-ed25519 ${pubWire.toString("base64")} gitpress-deploy`;

  const comment = Buffer.from("gitpress-deploy", "utf8");
  const checkint = randomBytes(4);
  let privateBlock = Buffer.concat([
    checkint,
    checkint,
    sshString(keyType),
    sshString(pub),
    sshString(priv),
    sshString(comment),
  ]);
  // Unencrypted ("none" cipher) blocks pad to 8 bytes with sequential 1,2,3,...
  const padLen = (8 - (privateBlock.length % 8)) % 8;
  privateBlock = Buffer.concat([
    privateBlock,
    Buffer.from(Array.from({ length: padLen }, (_, i) => i + 1)),
  ]);

  const none = Buffer.from("none", "ascii");
  const body = Buffer.concat([
    Buffer.from("openssh-key-v1\0", "binary"),
    sshString(none), // ciphername
    sshString(none), // kdfname
    sshString(Buffer.alloc(0)), // kdfoptions
    uint32(1), // number of keys
    sshString(pubWire),
    sshString(privateBlock),
  ]);

  const lines = body.toString("base64").match(/.{1,70}/g) ?? [];
  const privatePem = `-----BEGIN OPENSSH PRIVATE KEY-----\n${lines.join("\n")}\n-----END OPENSSH PRIVATE KEY-----\n`;

  return { privatePem, publicOpenSsh };
}

function uint32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value);
  return buffer;
}

function sshString(buf: Buffer): Buffer {
  return Buffer.concat([uint32(buf.length), buf]);
}

const DEPLOY_KEY_TITLE = "GitPress deploy key";

export async function addDeployKey(
  octokit: Octokit,
  ref: RepoRef,
  publicOpenSsh: string,
): Promise<void> {
  await octokit.request("POST /repos/{owner}/{repo}/keys", {
    ...ref,
    title: DEPLOY_KEY_TITLE,
    key: publicOpenSsh,
    read_only: false,
  });
}

/** Remove any previously-added GitPress deploy keys (used when rotating a broken/old key). */
export async function removeDeployKeys(octokit: Octokit, ref: RepoRef): Promise<void> {
  const { data: keys } = await octokit.request("GET /repos/{owner}/{repo}/keys", { ...ref });
  for (const key of keys) {
    if (key.title === DEPLOY_KEY_TITLE) {
      await octokit.request("DELETE /repos/{owner}/{repo}/keys/{key_id}", {
        ...ref,
        key_id: key.id,
      });
    }
  }
}

/** NaCl sealed box (libsodium crypto_box_seal): what GitHub expects for secrets. */
function sealedBox(message: Uint8Array, recipientPublicKey: Uint8Array): Uint8Array {
  const ephemeral = nacl.box.keyPair();
  // Nonce = BLAKE2b-24(ephemeralPk || recipientPk), per libsodium's sealed box spec.
  const nonce = blake2b(
    Buffer.concat([Buffer.from(ephemeral.publicKey), Buffer.from(recipientPublicKey)]),
    undefined,
    nacl.box.nonceLength,
  );
  const boxed = nacl.box(message, nonce, recipientPublicKey, ephemeral.secretKey);
  const sealed = new Uint8Array(ephemeral.publicKey.length + boxed.length);
  sealed.set(ephemeral.publicKey);
  sealed.set(boxed, ephemeral.publicKey.length);
  return sealed;
}

/** Encrypt and store a GitHub Actions secret (libsodium sealed box). */
export async function putActionsSecret(
  octokit: Octokit,
  ref: RepoRef,
  name: string,
  value: string,
): Promise<void> {
  const { data: publicKey } = await octokit.request(
    "GET /repos/{owner}/{repo}/actions/secrets/public-key",
    { ...ref },
  );
  const encrypted = sealedBox(Buffer.from(value, "utf8"), Buffer.from(publicKey.key, "base64"));
  await octokit.request("PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}", {
    ...ref,
    secret_name: name,
    encrypted_value: Buffer.from(encrypted).toString("base64"),
    key_id: publicKey.key_id,
  });
}

export interface PagesSiteInfo {
  htmlUrl: string | null;
  cname: string | null;
  httpsEnforced: boolean;
  certificateState: string | null;
  status: string | null;
  source: { branch: string; path: "/" | "/docs" };
}

function pagesSource(
  data: { source?: { branch?: string | null; path?: string | null } | null } | null,
): { branch: string; path: "/" | "/docs" } {
  const branch = data?.source?.branch?.trim() || "main";
  const path = data?.source?.path === "/docs" ? "/docs" : "/";
  return { branch, path };
}

function isNotFound(error: unknown): boolean {
  return (error as { status?: number }).status === 404;
}

export async function getPagesSite(octokit: Octokit, ref: RepoRef): Promise<PagesSiteInfo | null> {
  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/pages", { ...ref });
    const cert = data.https_certificate as { state?: string } | undefined;
    return {
      htmlUrl: data.html_url ?? null,
      cname: data.cname ?? null,
      httpsEnforced: Boolean(data.https_enforced),
      certificateState: cert?.state ?? null,
      status: data.status ?? null,
      source: pagesSource(data),
    };
  } catch {
    return null;
  }
}

/**
 * Register or clear a GitHub Pages custom domain. Needs Pages: write
 * (already requested). Does not touch the owner's DNS registrar.
 * Clearing does not enable Pages if it is currently off.
 */
export async function setPagesCustomDomain(
  octokit: Octokit,
  ref: RepoRef,
  cname: string | null,
): Promise<void> {
  let existing = await getPagesSite(octokit, ref);

  if (cname) {
    if (!existing) {
      const enabled = await enablePages(octokit, ref);
      if (!enabled) throw new Error("无法启用 GitHub Pages。");
      existing = await getPagesSite(octokit, ref);
    }
    await octokit.request("PUT /repos/{owner}/{repo}/pages", {
      ...ref,
      cname,
      source: existing?.source ?? { branch: "main", path: "/" },
    });
    return;
  }

  if (existing?.cname) {
    await octokit.request("PUT /repos/{owner}/{repo}/pages", {
      ...ref,
      cname: null as unknown as string,
      source: existing.source,
    });
  }

  try {
    await deleteFile(octokit, ref, "CNAME", "Remove Pages custom domain");
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }
}

/** Enable GitHub Pages serving from main branch root. Returns the Pages URL. */
export async function enablePages(octokit: Octokit, ref: RepoRef): Promise<string | null> {
  try {
    await octokit.request("POST /repos/{owner}/{repo}/pages", {
      ...ref,
      source: { branch: "main", path: "/" },
    });
  } catch (error: unknown) {
    const status = (error as { status?: number }).status;
    // 409 = already enabled; anything else bubbles up as "not enabled".
    if (status !== 409) return null;
  }
  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/pages", { ...ref });
    return data.html_url ?? `https://${ref.owner.toLowerCase()}.github.io/${ref.repo}/`;
  } catch {
    return `https://${ref.owner.toLowerCase()}.github.io/${ref.repo}/`;
  }
}

/**
 * Trigger a rebuild.
 *
 * We'd normally call `workflow_dispatch`, but that REST endpoint (and
 * listing runs, see `listBuildRuns` below) needs the GitHub App's "Actions"
 * permission — a *different* scope than "Workflows" (which only covers
 * editing `.github/workflows/*.yml` file contents). Our App doesn't request
 * "Actions", and even after adding it to the App manifest every existing
 * installation would need to re-approve the upgraded scope before it takes
 * effect. So instead we push a tiny, real commit (needs only the "Contents:
 * write" permission we already have) — a push to `main` reliably fires the
 * `on: push` trigger in gitpress-build.yml, exactly like any other commit.
 */
export async function dispatchBuild(octokit: Octokit, ref: RepoRef): Promise<void> {
  await putFile(
    octokit,
    ref,
    ".gitpress/trigger",
    { utf8: `${new Date().toISOString()}\n` },
    "Trigger rebuild",
  );
}

export interface BuildRun {
  id: number;
  status: string | null;
  conclusion: string | null;
  createdAt: string;
  htmlUrl: string;
  /** First line of the triggering commit's message — GitHub returns this for
   *  free alongside the run, so we can show *what* was built, not just *when*. */
  commitMessage: string | null;
  /** Wall-clock seconds the run took, once it has concluded; null while running. */
  durationSeconds: number | null;
}

export interface BuildRunsResult {
  runs: BuildRun[];
  /** True when the call failed with 403 — almost always the missing "Actions" App permission described above. */
  actionsPermissionMissing: boolean;
}

/** List recent workflow runs for the site dashboard (see the permission note on `dispatchBuild`). */
export async function listBuildRuns(octokit: Octokit, ref: RepoRef): Promise<BuildRunsResult> {
  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/actions/runs", {
      ...ref,
      per_page: 5,
    });
    return {
      runs: data.workflow_runs.map((run) => {
        const concluded = run.status === "completed" && run.conclusion != null;
        const startedAt = run.run_started_at ?? run.created_at;
        const durationSeconds = concluded
          ? Math.max(
              0,
              Math.round((new Date(run.updated_at).getTime() - new Date(startedAt).getTime()) / 1000),
            )
          : null;
        return {
          id: run.id,
          status: run.status,
          conclusion: run.conclusion,
          createdAt: run.created_at,
          htmlUrl: run.html_url,
          commitMessage: run.head_commit?.message?.split("\n")[0]?.trim() || null,
          durationSeconds,
        };
      }),
      actionsPermissionMissing: false,
    };
  } catch (error: unknown) {
    const status = (error as { status?: number }).status;
    if (status !== 403) console.error("listBuildRuns failed:", error);
    return { runs: [], actionsPermissionMissing: status === 403 };
  }
}

/** Free-plan included minutes for private-repo Actions (public repos are free). */
export const GITHUB_ACTIONS_FREE_INCLUDED_MINUTES = 2000;

export interface ActionsDayUsage {
  /** Calendar date in Asia/Shanghai, `YYYY-MM-DD`. */
  date: string;
  day: number;
  minutes: number;
  runCount: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface ActionsUsage {
  actionsPermissionMissing: boolean;
  /** Wall-clock minutes of this site's data-repo workflow runs so far this month. */
  siteMinutesThisMonth: number | null;
  siteRunCountThisMonth: number | null;
  /** One entry per calendar day of the current Shanghai month (future days are zero). */
  daily: ActionsDayUsage[];
  /** Account-wide Actions minutes from GitHub billing, if the user token can read it. */
  accountMinutesThisMonth: number | null;
  accountIncludedMinutes: number | null;
  billingUnavailable: boolean;
  billingUrl: string;
  periodLabel: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function shanghaiParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: num("year"), month: num("month"), day: num("day") };
}

function daysInCalendarMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function emptyDaily(year: number, month: number, todayDay: number): ActionsDayUsage[] {
  const days = daysInCalendarMonth(year, month);
  return Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    return {
      date: `${year}-${pad2(month)}-${pad2(day)}`,
      day,
      minutes: 0,
      runCount: 0,
      isToday: day === todayDay,
      isFuture: day > todayDay,
    };
  });
}

function actionsMinutesFromUsageItems(
  items: Array<{ product?: string; sku?: string; unitType?: string; netQuantity?: number; quantity?: number }>,
): number | null {
  const matched = items.filter(
    (item) => /action/i.test(item.product ?? "") || /action/i.test(item.sku ?? ""),
  );
  if (matched.length === 0) return null;
  let minutes = 0;
  for (const item of matched) {
    const quantity = item.netQuantity ?? item.quantity ?? 0;
    const unit = (item.unitType ?? "minute").toLowerCase();
    if (unit.includes("hour")) minutes += quantity * 60;
    else if (unit.includes("second")) minutes += quantity / 60;
    else minutes += quantity;
  }
  return minutes;
}

async function githubJson(token: string, url: string): Promise<unknown | null> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchAccountActionsBilling(
  userToken: string,
  accountLogin: string,
  accountType: string,
  year: number,
  month: number,
): Promise<{ minutes: number | null; included: number | null }> {
  const isOrg = accountType === "Organization";
  const encoded = encodeURIComponent(accountLogin);
  const summaryUrl = isOrg
    ? `https://api.github.com/organizations/${encoded}/settings/billing/usage/summary?year=${year}&month=${month}`
    : `https://api.github.com/users/${encoded}/settings/billing/usage/summary?year=${year}&month=${month}`;
  const summary = await githubJson(userToken, summaryUrl);
  if (summary && typeof summary === "object") {
    const items = (summary as { usageItems?: Array<Record<string, unknown>> }).usageItems ?? [];
    const minutes = actionsMinutesFromUsageItems(
      items.map((item) => ({
        product: typeof item.product === "string" ? item.product : undefined,
        sku: typeof item.sku === "string" ? item.sku : undefined,
        unitType: typeof item.unitType === "string" ? item.unitType : undefined,
        netQuantity: typeof item.netQuantity === "number" ? item.netQuantity : undefined,
        quantity: typeof item.quantity === "number" ? item.quantity : undefined,
      })),
    );
    if (minutes != null) return { minutes, included: null };
  }

  const legacyUrl = isOrg
    ? `https://api.github.com/orgs/${encoded}/settings/billing/actions`
    : `https://api.github.com/users/${encoded}/settings/billing/actions`;
  const legacy = await githubJson(userToken, legacyUrl);
  if (legacy && typeof legacy === "object") {
    const data = legacy as { total_minutes_used?: unknown; included_minutes?: unknown };
    return {
      minutes: typeof data.total_minutes_used === "number" ? data.total_minutes_used : null,
      included: typeof data.included_minutes === "number" ? data.included_minutes : null,
    };
  }
  return { minutes: null, included: null };
}

/**
 * Dashboard figure for GitHub Actions: this site's data-repo minutes this
 * month (Actions API), plus account-wide billing when the stored user token
 * is allowed to read it. Installation tokens almost never can.
 */
export async function getActionsUsage(options: {
  octokit: Octokit;
  dataRepo: string;
  accountLogin: string;
  accountType: string;
  userToken?: string | null;
}): Promise<ActionsUsage> {
  const now = new Date();
  const { year, month, day: todayDay } = shanghaiParts(now);
  const periodLabel = `${year}年${month}月`;
  const billingUrl =
    options.accountType === "Organization"
      ? `https://github.com/organizations/${options.accountLogin}/settings/billing`
      : "https://github.com/settings/billing";
  const daily = emptyDaily(year, month, todayDay);

  const empty: ActionsUsage = {
    actionsPermissionMissing: false,
    siteMinutesThisMonth: null,
    siteRunCountThisMonth: null,
    daily: [],
    accountMinutesThisMonth: null,
    accountIncludedMinutes: null,
    billingUnavailable: true,
    billingUrl,
    periodLabel,
  };

  const ref = splitRepo(options.dataRepo);
  const monthStart = new Date(`${year}-${pad2(month)}-01T00:00:00+08:00`);
  const createdSince = monthStart.toISOString().slice(0, 10);
  let siteSeconds = 0;
  let siteRunCount = 0;
  try {
    for (let page = 1; page <= 5; page += 1) {
      const { data } = await options.octokit.request("GET /repos/{owner}/{repo}/actions/runs", {
        ...ref,
        per_page: 100,
        page,
        created: `>=${createdSince}`,
      });
      const runs = data.workflow_runs ?? [];
      for (const run of runs) {
        const startedAt = run.run_started_at ?? run.created_at;
        const started = shanghaiParts(new Date(startedAt));
        if (started.year !== year || started.month !== month) continue;
        const endedAt = run.status === "completed" ? run.updated_at : now.toISOString();
        const seconds = Math.max(
          0,
          (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
        );
        const slot = daily[started.day - 1];
        if (!slot) continue;
        slot.runCount += 1;
        slot.minutes += seconds / 60;
        siteSeconds += seconds;
        siteRunCount += 1;
      }
      if (runs.length < 100) break;
    }
  } catch (error: unknown) {
    const status = (error as { status?: number }).status;
    if (status === 403) {
      return { ...empty, actionsPermissionMissing: true };
    }
    console.error("getActionsUsage runs failed:", error);
    return empty;
  }

  for (const slot of daily) {
    slot.minutes = Math.round(slot.minutes * 10) / 10;
  }

  let accountMinutesThisMonth: number | null = null;
  let accountIncludedMinutes: number | null = null;
  let billingUnavailable = true;
  if (options.userToken) {
    const billing = await fetchAccountActionsBilling(
      options.userToken,
      options.accountLogin,
      options.accountType,
      year,
      month,
    );
    accountMinutesThisMonth = billing.minutes;
    accountIncludedMinutes = billing.included;
    billingUnavailable = billing.minutes == null && billing.included == null;
  }

  return {
    actionsPermissionMissing: false,
    siteMinutesThisMonth: Math.ceil(siteSeconds / 60),
    siteRunCountThisMonth: siteRunCount,
    daily,
    accountMinutesThisMonth,
    accountIncludedMinutes,
    billingUnavailable,
    billingUrl,
    periodLabel,
  };
}
