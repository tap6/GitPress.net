import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { githubInstallations } from "@/db/schema";
import { localeFromRequest, localizedPath } from "@/i18n/requestPath";
import { exchangeOAuthCode, fetchInstallationInfo } from "@/lib/github";
import {
  clearPendingGithubSetup,
  GITHUB_SETUP_COOKIE,
  parsePendingGithubSetup,
  pendingGithubSetupFromSearch,
  writePendingGithubSetup,
  type PendingGithubSetup,
} from "@/lib/githubSetupPending";

/**
 * GitHub App post-install / post-update callback:
 *   /api/github/setup?installation_id=...&setup_action=install|update&code=...
 *
 * Setup URL stays unprefixed (`/api/github/setup`). After the handshake we
 * bounce to the product locale from the NEXT_LOCALE cookie.
 *
 * If the user is signed out, the one-time OAuth `code` is stored in an httpOnly
 * cookie and they are sent to `/login`. Sign-in then resumes this route.
 */
function redirectApp(request: NextRequest, href: string, search = "", pending?: PendingGithubSetup | "clear") {
  const locale = localeFromRequest(request);
  const url = new URL(localizedPath(href, locale), request.url);
  if (search) url.search = search.startsWith("?") ? search.slice(1) : search;
  const response = NextResponse.redirect(url);
  if (pending === "clear") clearPendingGithubSetup(response);
  else if (pending) writePendingGithubSetup(response, pending);
  return response;
}

export async function GET(request: NextRequest) {
  const fromQuery = pendingGithubSetupFromSearch(request.nextUrl.searchParams);
  const fromCookie = parsePendingGithubSetup(request.cookies.get(GITHUB_SETUP_COOKIE)?.value);
  const pending = fromQuery ?? fromCookie;

  const session = await auth();
  if (!session?.user?.id) {
    if (!pending) return redirectApp(request, "/login");
    return redirectApp(request, "/login", "", pending);
  }

  if (!pending) {
    return redirectApp(request, "/dashboard", "github=error", "clear");
  }

  const [existing] = await db
    .select({ userId: githubInstallations.userId })
    .from(githubInstallations)
    .where(eq(githubInstallations.installationId, pending.installationId))
    .limit(1);
  if (existing && existing.userId !== session.user.id) {
    return redirectApp(request, "/dashboard", "github=error", "clear");
  }
  if (!existing && !pending.code) {
    return redirectApp(request, "/dashboard", "github=error", "clear");
  }

  const info = await fetchInstallationInfo(pending.installationId);

  let userToken: string | null = null;
  let refreshToken: string | null = null;
  if (pending.code) {
    const tokens = await exchangeOAuthCode(pending.code);
    if (tokens) {
      userToken = tokens.accessToken;
      refreshToken = tokens.refreshToken ?? null;
    }
  }

  await db
    .insert(githubInstallations)
    .values({
      userId: session.user.id,
      installationId: pending.installationId,
      accountLogin: info.accountLogin,
      accountType: info.accountType,
      userToken,
      refreshToken,
    })
    .onConflictDoUpdate({
      target: githubInstallations.installationId,
      set: {
        accountLogin: info.accountLogin,
        accountType: info.accountType,
        ...(userToken ? { userToken, refreshToken } : {}),
      },
    });

  if (pending.setupAction === "update") {
    return redirectApp(request, "/dashboard", "github=permissions-updated", "clear");
  }

  return redirectApp(request, "/new", "github=connected", "clear");
}
