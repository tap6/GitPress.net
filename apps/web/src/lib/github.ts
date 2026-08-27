import { App, Octokit } from "octokit";
import { generateKeyPairSync } from "node:crypto";
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

/** Generate an ed25519 keypair: PKCS8 PEM private key + OpenSSH public key. */
export function generateDeployKeyPair(): { privatePem: string; publicOpenSsh: string } {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const privatePem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

  // OpenSSH wire format: len("ssh-ed25519") + "ssh-ed25519" + len(key) + 32-byte key
  const jwk = publicKey.export({ format: "jwk" }) as { x: string };
  const raw = Buffer.from(jwk.x, "base64url");
  const type = Buffer.from("ssh-ed25519", "ascii");
  const wire = Buffer.concat([
    uint32(type.length),
    type,
    uint32(raw.length),
    raw,
  ]);
  return {
    privatePem,
    publicOpenSsh: `ssh-ed25519 ${wire.toString("base64")} gitpress-deploy`,
  };
}

function uint32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value);
  return buffer;
}

export async function addDeployKey(
  octokit: Octokit,
  ref: RepoRef,
  publicOpenSsh: string,
): Promise<void> {
  await octokit.request("POST /repos/{owner}/{repo}/keys", {
    ...ref,
    title: "GitPress deploy key",
    key: publicOpenSsh,
    read_only: false,
  });
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

/** Best-effort manual build trigger. */
export async function dispatchBuild(octokit: Octokit, ref: RepoRef): Promise<void> {
  try {
    await octokit.request(
      "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
      { ...ref, workflow_id: "gitpress-build.yml", ref: "main" },
    );
  } catch {
    // The push events already trigger builds; dispatch is just a nudge.
  }
}

/** List recent workflow runs for the site dashboard. */
export async function listBuildRuns(octokit: Octokit, ref: RepoRef) {
  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/actions/runs", {
      ...ref,
      per_page: 5,
    });
    return data.workflow_runs.map((run) => ({
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      createdAt: run.created_at,
      htmlUrl: run.html_url,
    }));
  } catch {
    return [];
  }
}
