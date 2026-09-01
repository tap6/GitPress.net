import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { redirect } from "@/i18n/navigation";
import { PRODUCT_PATHNAME_HEADER, stripLocalePrefix } from "@/i18n/localePath";

export async function getPreferredLocale(userId: string): Promise<"zh" | "en" | null> {
  const [row] = await db
    .select({ preferredLocale: users.preferredLocale })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const value = row?.preferredLocale;
  return value === "en" || value === "zh" ? value : null;
}

/**
 * Unprefixed routes are Chinese (`as-needed`). If the product locale should be
 * English (cookie or saved preference), bounce before rendering the wrong UI.
 */
export async function maybeRedirectToPreferredLocale(fallbackHref = "/"): Promise<void> {
  const locale = await getLocale();
  if (locale === "en") return;
  const jar = await cookies();
  const cookie = jar.get("NEXT_LOCALE")?.value;
  let want: "en" | "zh" | null = cookie === "en" || cookie === "zh" ? cookie : null;
  if (!want) {
    try {
      const session = await auth();
      if (session?.user?.id) want = await getPreferredLocale(session.user.id);
    } catch {
      return;
    }
  }
  if (want !== "en") return;
  const raw = (await headers()).get(PRODUCT_PATHNAME_HEADER);
  const href = raw ? stripLocalePrefix(raw) : fallbackHref;
  redirect({ href, locale: "en" });
}
