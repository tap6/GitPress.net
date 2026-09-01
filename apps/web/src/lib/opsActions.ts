"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db";
import { themeListings, users, type ThemeListingStatus } from "@/db/schema";
import { actionError } from "./actionError";
import { emailIsOpsAllowlisted, requireOps } from "./ops";
import { PUBLIC_STATS_TAG } from "./publicStats";
import {
  assertUsableThemeManifest,
  fetchGithubThemeManifest,
  formatGithubThemeSource,
  parseGithubThemeInput,
  themeCardCacheFromManifest,
} from "./themeSource";

export interface OpsFormState {
  error?: string;
  saved?: boolean;
  name?: string;
}

function revalidateOps(): void {
  revalidatePath("/ops");
  revalidatePath("/ops/users");
  revalidatePath("/ops/sites");
  revalidatePath("/ops/installations");
  revalidatePath("/ops/themes");
  revalidatePath("/", "layout");
  revalidateTag(PUBLIC_STATS_TAG);
}

export async function addThemeListingAction(
  _prev: OpsFormState,
  formData: FormData,
): Promise<OpsFormState> {
  const operator = await requireOps();

  let parsed;
  try {
    parsed = parseGithubThemeInput(
      String(formData.get("repo") ?? ""),
      String(formData.get("subdir") ?? ""),
      String(formData.get("ref") ?? ""),
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  const source = formatGithubThemeSource(parsed);
  const manifest = await fetchGithubThemeManifest(source);
  if (!manifest) {
    return { error: "themeJsonPublic" };
  }
  try {
    assertUsableThemeManifest(manifest);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  const notes = String(formData.get("notes") ?? "").trim() || null;
  const statusRaw = String(formData.get("status") ?? "listed");
  const status: ThemeListingStatus =
    statusRaw === "hidden" || statusRaw === "pending" ? statusRaw : "listed";

  try {
    await db.insert(themeListings).values({
      ...themeCardCacheFromManifest(source, manifest),
      source,
      status,
      notes,
      createdByUserId: operator.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("theme_listing") || message.toLowerCase().includes("unique")) {
      return { error: actionError("catalogHasSource", { source }) };
    }
    return { error: actionError("addFailed", { detail: message }) };
  }

  revalidateOps();
  return { saved: true, name: manifest.displayName?.trim() || manifest.name };
}

export async function setThemeListingStatusAction(formData: FormData): Promise<void> {
  await requireOps();
  const id = String(formData.get("listingId") ?? "");
  const statusRaw = String(formData.get("status") ?? "");
  const status: ThemeListingStatus | null =
    statusRaw === "listed" || statusRaw === "hidden" || statusRaw === "pending" ? statusRaw : null;
  if (!id || !status) return;

  await db
    .update(themeListings)
    .set({ status, updatedAt: new Date() })
    .where(eq(themeListings.id, id));
  revalidateOps();
}

export async function refreshThemeListingAction(formData: FormData): Promise<void> {
  await requireOps();
  const id = String(formData.get("listingId") ?? "");
  if (!id) return;
  const [row] = await db.select().from(themeListings).where(eq(themeListings.id, id)).limit(1);
  if (!row) return;

  const manifest = await fetchGithubThemeManifest(row.source);
  if (!manifest) throw new Error("refreshThemeFail");
  assertUsableThemeManifest(manifest);

  await db
    .update(themeListings)
    .set({
      ...themeCardCacheFromManifest(row.source, manifest),
      updatedAt: new Date(),
    })
    .where(eq(themeListings.id, id));
  revalidateOps();
}

export async function deleteThemeListingAction(formData: FormData): Promise<void> {
  await requireOps();
  const id = String(formData.get("listingId") ?? "");
  if (!id) return;
  await db.delete(themeListings).where(eq(themeListings.id, id));
  revalidateOps();
}

export async function setUserOpsRoleAction(formData: FormData): Promise<void> {
  const operator = await requireOps();
  const userId = String(formData.get("userId") ?? "");
  const grant = String(formData.get("grant") ?? "") === "1";
  if (!userId) return;

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return;

  if (!grant && userId === operator.id && !emailIsOpsAllowlisted(operator.email)) {
    throw new Error("cannotRevokeSelf");
  }

  await db
    .update(users)
    .set({ role: grant ? "ops" : null })
    .where(eq(users.id, userId));
  revalidateOps();
}
