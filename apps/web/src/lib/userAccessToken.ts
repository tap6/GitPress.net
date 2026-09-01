import { eq } from "drizzle-orm";
import { db } from "@/db";
import { githubInstallations } from "@/db/schema";
import { refreshUserAccessToken, userAccessTokenAlive } from "@/lib/github";

export type InstallationUserTokens = {
  id: string;
  userToken?: string | null;
  refreshToken?: string | null;
};

const inflight = new Map<string, Promise<string | null>>();

async function persistTokens(
  installationId: string,
  accessToken: string | null,
  refreshToken: string | null,
): Promise<void> {
  await db
    .update(githubInstallations)
    .set({ userToken: accessToken, refreshToken })
    .where(eq(githubInstallations.id, installationId));
}

/**
 * GitHub App user-to-server tokens expire in 8 hours. Refresh tokens are
 * single-use, so concurrent refreshes share one in-flight promise and a
 * failed refresh re-reads the row in case another request already rotated it.
 */
export async function refreshInstallationUserToken(
  installation: InstallationUserTokens,
): Promise<string | null> {
  const existing = inflight.get(installation.id);
  if (existing) return existing;
  const promise = rotate(installation).finally(() => inflight.delete(installation.id));
  inflight.set(installation.id, promise);
  return promise;
}

async function rotate(installation: InstallationUserTokens): Promise<string | null> {
  if (!installation.refreshToken) return null;
  const tokens = await refreshUserAccessToken(installation.refreshToken);
  if (tokens) {
    const nextRefresh = tokens.refreshToken ?? installation.refreshToken ?? null;
    await persistTokens(installation.id, tokens.accessToken, nextRefresh);
    installation.userToken = tokens.accessToken;
    installation.refreshToken = nextRefresh;
    return tokens.accessToken;
  }

  const [row] = await db
    .select({
      userToken: githubInstallations.userToken,
      refreshToken: githubInstallations.refreshToken,
    })
    .from(githubInstallations)
    .where(eq(githubInstallations.id, installation.id))
    .limit(1);
  if (row?.userToken && row.userToken !== installation.userToken) {
    const alive = await userAccessTokenAlive(row.userToken);
    if (alive) {
      installation.userToken = row.userToken;
      installation.refreshToken = row.refreshToken;
      return row.userToken;
    }
  }
  return null;
}

/** Return a live user-to-server token, refreshing once if GitHub says 401. */
export async function resolveInstallationUserToken(
  installation: InstallationUserTokens,
): Promise<string | null> {
  if (installation.userToken) {
    const alive = await userAccessTokenAlive(installation.userToken);
    if (alive) return installation.userToken;
  }
  if (!installation.refreshToken) return installation.userToken ?? null;
  return refreshInstallationUserToken(installation);
}
