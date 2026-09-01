import { NextRequest } from "next/server";
import { getPathname } from "@/i18n/navigation";
import { localePrefixOf } from "@/i18n/localePath";
import type { AppLocale } from "@/i18n/routing";

export function localeFromRequest(request: NextRequest): AppLocale {
  const value = request.cookies.get("NEXT_LOCALE")?.value;
  if (value === "en" || value === "zh") return value;
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      if (localePrefixOf(new URL(referer).pathname) === "en") return "en";
    } catch {
      // Ignore malformed Referer.
    }
  }
  return "zh";
}

export function localizedPath(href: string, locale: AppLocale): string {
  const pathOnly = href.split("?")[0] || "/";
  return getPathname({ href: pathOnly as never, locale });
}
