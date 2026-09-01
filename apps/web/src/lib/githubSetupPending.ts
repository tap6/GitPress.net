import type { NextResponse } from "next/server";

export const GITHUB_SETUP_COOKIE = "gp_github_setup";
export const GITHUB_SETUP_RESUME_PATH = "/api/github/setup";

const MAX_AGE_SEC = 10 * 60;
const MAX_CODE_LEN = 512;

export type PendingGithubSetup = {
  installationId: number;
  code?: string;
  setupAction?: "install" | "update";
};

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.AUTH_URL?.startsWith("https:") === true,
  };
}

function sanitizeCode(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const code = value.trim();
  if (!code || code.length > MAX_CODE_LEN) return undefined;
  if (!/^[\w./+=-]+$/.test(code)) return undefined;
  return code;
}

function sanitizeSetupAction(value: unknown): "install" | "update" | undefined {
  return value === "install" || value === "update" ? value : undefined;
}

export function parsePendingGithubSetup(raw: string | undefined | null): PendingGithubSetup | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { installationId?: unknown; code?: unknown; setupAction?: unknown };
    const installationId = Number(data.installationId);
    if (!Number.isInteger(installationId) || installationId <= 0) return null;
    return {
      installationId,
      code: sanitizeCode(data.code),
      setupAction: sanitizeSetupAction(data.setupAction),
    };
  } catch {
    return null;
  }
}

export function pendingGithubSetupFromSearch(params: URLSearchParams): PendingGithubSetup | null {
  const installationId = Number(params.get("installation_id"));
  if (!Number.isInteger(installationId) || installationId <= 0) return null;
  return {
    installationId,
    code: sanitizeCode(params.get("code")),
    setupAction: sanitizeSetupAction(params.get("setup_action")),
  };
}

export function writePendingGithubSetup(response: NextResponse, pending: PendingGithubSetup) {
  response.cookies.set(GITHUB_SETUP_COOKIE, JSON.stringify(pending), {
    ...cookieBase(),
    maxAge: MAX_AGE_SEC,
  });
}

export function clearPendingGithubSetup(response: NextResponse) {
  response.cookies.set(GITHUB_SETUP_COOKIE, "", { ...cookieBase(), maxAge: 0 });
}
