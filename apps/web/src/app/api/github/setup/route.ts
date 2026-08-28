import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { githubInstallations } from "@/db/schema";
import { exchangeOAuthCode, fetchInstallationInfo } from "@/lib/github";

/**
 * GitHub App post-install / post-update callback:
 *   /api/github/setup?installation_id=...&setup_action=install|update&code=...
 *
 * `setup_action=update` is GitHub redirecting back after the account owner
 * accepted new App permissions (requires "Redirect on update" in the App
 * settings). We still upsert the installation row, then send them to the
 * dashboard instead of the create-site wizard.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const params = request.nextUrl.searchParams;
  const installationId = Number(params.get("installation_id"));
  if (!Number.isFinite(installationId) || installationId <= 0) {
    return NextResponse.redirect(new URL("/dashboard?github=error", request.url));
  }

  const info = await fetchInstallationInfo(installationId);

  let userToken: string | null = null;
  let refreshToken: string | null = null;
  const code = params.get("code");
  if (code) {
    const tokens = await exchangeOAuthCode(code);
    if (tokens) {
      userToken = tokens.accessToken;
      refreshToken = tokens.refreshToken ?? null;
    }
  }

  await db
    .insert(githubInstallations)
    .values({
      userId: session.user.id,
      installationId,
      accountLogin: info.accountLogin,
      accountType: info.accountType,
      userToken,
      refreshToken,
    })
    .onConflictDoUpdate({
      target: githubInstallations.installationId,
      set: {
        userId: session.user.id,
        accountLogin: info.accountLogin,
        accountType: info.accountType,
        ...(userToken ? { userToken, refreshToken } : {}),
      },
    });

  const setupAction = params.get("setup_action");
  if (setupAction === "update") {
    return NextResponse.redirect(new URL("/dashboard?github=permissions-updated", request.url));
  }

  return NextResponse.redirect(new URL("/new?github=connected", request.url));
}

