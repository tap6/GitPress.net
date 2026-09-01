"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function persistPreferredLocaleAction(locale: string) {
  if (locale !== "zh" && locale !== "en") return;
  const jar = await cookies();
  jar.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return;
    await db.update(users).set({ preferredLocale: locale }).where(eq(users.id, userId));
  } catch {
    // Cookie is enough for this session; a down database must not block the switcher.
  }
}
