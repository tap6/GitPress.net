import { getLocale } from "next-intl/server";
import { redirect } from "./navigation";

/** Locale-aware redirect for server code. Uses the current request locale. */
export async function redirectTo(href: string): Promise<never> {
  const locale = await getLocale();
  redirect({ href, locale });
  throw new Error("redirectTo");
}
