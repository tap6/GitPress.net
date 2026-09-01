import { defineRouting } from "next-intl/routing";

export const locales = ["zh", "en"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "zh",
  localePrefix: "as-needed",
  localeDetection: false,
});

export function htmlLang(locale: string): string {
  return locale === "zh" ? "zh-CN" : "en";
}

export function siteLanguageForLocale(locale: string): string {
  return locale === "zh" ? "zh-CN" : "en";
}
