"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { persistPreferredLocaleAction } from "@/lib/localePreference";
import { routing, type AppLocale } from "@/i18n/routing";

const PENDING_KEY = "gp-locale-persist";

const LOCALES: { id: AppLocale; label: string; hrefLang: string }[] = [
  { id: "zh", label: "中文", hrefLang: "zh-CN" },
  { id: "en", label: "English", hrefLang: "en" },
];

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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((item) => item.id === locale) ?? LOCALES[0];

  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_KEY);
    if (pending !== locale) return;
    sessionStorage.removeItem(PENDING_KEY);
    void persistPreferredLocaleAction(locale);
  }, [locale]);

  useEffect(() => {
    const hasCookie = document.cookie.split(";").some((part) => part.trim().startsWith("NEXT_LOCALE="));
    if (!hasCookie && (locale === "zh" || locale === "en")) {
      writeLocaleCookie(locale);
    }
  }, [locale]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
    <div ref={rootRef} className="relative inline-block text-sm">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("switch")}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1 ${className}`}
      >
        {current.label}
        <span className="text-[10px] leading-none opacity-70" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 min-w-[7.5rem] rounded-md border border-neutral-200 bg-white py-1 text-neutral-800 shadow-md"
        >
          {LOCALES.map((item) => (
            <li key={item.id} role="option" aria-selected={item.id === locale}>
              <a
                href={hrefForLocale(pathname, item.id)}
                hrefLang={item.hrefLang}
                onClick={(event) => onSwitch(event, item.id)}
                className={`block px-3 py-1.5 hover:bg-neutral-50 ${
                  item.id === locale ? "font-semibold text-neutral-900" : "text-neutral-600"
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
