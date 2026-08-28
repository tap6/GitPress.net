import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "./sites";

export type OpsUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function parseOpsEmails(): Set<string> {
  return new Set(
    (process.env.GITPRESS_OPS_EMAILS ?? "")
      .split(/[,;\s]+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Bootstrap allowlist — independent of the `user.role` column. */
export function emailIsOpsAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseOpsEmails().has(email.trim().toLowerCase());
}

export async function userHasOpsAccess(user: OpsUser): Promise<boolean> {
  if (emailIsOpsAllowlisted(user.email)) return true;
  const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1);
  return row?.role === "ops";
}

/** Site-owner admin stays on `/sites/[id]`. Operators who fail this go back to their dashboard. */
export async function requireOps(): Promise<OpsUser> {
  const user = await requireUser();
  if (!(await userHasOpsAccess(user))) redirect("/dashboard");
  return user;
}

export function githubRepoHref(ownerRepo: string): string {
  const trimmed = ownerRepo.trim();
  const [owner, name] = trimmed.split("/");
  if (!owner || !name) return `https://github.com/${trimmed}`;
  return `https://github.com/${owner}/${name}`;
}

export function formatOpsDate(value: Date | null | undefined): string {
  if (!value) return "—";
  return value.toLocaleString("zh-CN", { hour12: false });
}
