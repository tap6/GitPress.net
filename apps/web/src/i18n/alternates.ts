import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

const SITE = process.env.AUTH_URL?.replace(/\/$/, "") || "https://gitpress.net";

export function localeAlternates(href: string) {
  const zh = getPathname({ href, locale: "zh" as AppLocale });
  const en = getPathname({ href, locale: "en" as AppLocale });
  return {
    canonical: undefined as string | undefined,
    languages: {
      "zh-CN": `${SITE}${zh === "/" ? "" : zh}`,
      en: `${SITE}${en}`,
      "x-default": `${SITE}${zh === "/" ? "" : zh}`,
    },
  };
}
