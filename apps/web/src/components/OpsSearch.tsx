"use client";

import { useTranslations } from "next-intl";
import { Link, getPathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";

export function OpsSearch({
  action,
  q,
  placeholder,
}: {
  action: string;
  q?: string;
  placeholder: string;
}) {
  const t = useTranslations("ops");
  const locale = useLocale();
  const localized = getPathname({ href: action as "/ops", locale });

  return (
    <form action={localized} className="flex flex-wrap items-center gap-2">
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder={placeholder}
        className="w-72 max-w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-ops-accent focus:outline-none"
      />
      <button type="submit" className="rounded bg-ops-ink px-3 py-1.5 text-sm text-white hover:bg-slate-800">
        {t("search")}
      </button>
      {q ? (
        <Link href={action as "/ops"} className="text-sm text-slate-500 hover:text-slate-800">
          {t("clear")}
        </Link>
      ) : null}
    </form>
  );
}
