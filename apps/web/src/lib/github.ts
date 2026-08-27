import { App, Octokit } from "octokit";
import { randomBytes } from "node:crypto";
import nacl from "tweetnacl";
import { blake2b } from "blakejs";

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
