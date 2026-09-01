"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { persistPreferredLocaleAction } from "@/lib/localePreference";
import { routing, type AppLocale } from "@/i18n/routing";

const PENDING_KEY = "gp-locale-persist";

function hrefForLocale(pathname: string, locale: AppLocale): string {
  if (locale === routing.defaultLocale) return pathname || "/";
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

function writeLocaleCookie(locale: AppLocale) {
  document.cookie = `NEXT_LOCALE=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("locale");

  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_KEY);
    if (pending !== locale) return;
    sessionStorage.removeItem(PENDING_KEY);
    void persistPreferredLocaleAction(locale);
  }, [locale]);

  function onSwitch(event: React.MouseEvent<HTMLAnchorElement>, next: AppLocale) {
    writeLocaleCookie(next);
    sessionStorage.setItem(PENDING_KEY, next);
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    window.location.assign(hrefForLocale(pathname, next));
  }

  return (
    <nav className={`inline-flex items-center gap-2 text-sm ${className}`} aria-label={t("switch")}>
      <a
        href={hrefForLocale(pathname, "zh")}
        hrefLang="zh-CN"
        onClick={(event) => onSwitch(event, "zh")}
        className={locale === "zh" ? "font-semibold text-neutral-900" : "text-neutral-500 hover:text-neutral-900"}
      >
        中文
      </a>
      <span className="text-neutral-300" aria-hidden>
        |
      </span>
      <a
        href={hrefForLocale(pathname, "en")}
        hrefLang="en"
        onClick={(event) => onSwitch(event, "en")}
        className={locale === "en" ? "font-semibold text-neutral-900" : "text-neutral-500 hover:text-neutral-900"}
      >
        English
      </a>
    </nav>
  );
}
