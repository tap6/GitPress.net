import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { SITE_URL } from "@/lib/siteUrl";

export function absoluteUrl(path: string): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localeAlternates(href: string, locale: AppLocale = "zh") {
  const zh = getPathname({ href: href as never, locale: "zh" });
  const en = getPathname({ href: href as never, locale: "en" });
  const current = locale === "en" ? en : zh;
  return {
    canonical: absoluteUrl(current),
    languages: {
      "zh-CN": absoluteUrl(zh),
      en: absoluteUrl(en),
      "x-default": absoluteUrl(zh),
    },
  };
}
