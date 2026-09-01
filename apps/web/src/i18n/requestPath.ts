import { NextRequest } from "next/server";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function localeFromRequest(request: NextRequest): AppLocale {
  const value = request.cookies.get("NEXT_LOCALE")?.value;
  return value === "en" ? "en" : "zh";
}

export function localizedPath(href: string, locale: AppLocale): string {
  const pathOnly = href.split("?")[0] || "/";
  return getPathname({ href: pathOnly as never, locale });
}
