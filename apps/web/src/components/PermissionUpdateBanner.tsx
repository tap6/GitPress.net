"use client";

import { useTranslations } from "next-intl";
import type { PermissionGap } from "@/lib/github";

interface Props {
  gap: PermissionGap;
  compact?: boolean;
}

export function PermissionUpdateBanner({ gap, compact = false }: Props) {
  const t = useTranslations("github");
  const missing = gap.missing
    .map((item) => (t.has(item.name) ? t(item.name) : item.label))
    .join(" · ");
  const suffix = missing ? t("missingSuffix", { missing }) : "";
  return (
    <div
      className={
        compact
          ? "rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          : "border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 sm:px-8"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>{t("banner", { account: gap.accountLogin, suffix })}</p>
        <a
          href={gap.reviewUrl}
          className="shrink-0 rounded bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900"
        >
          {t("reviewPermissions")}
        </a>
      </div>
    </div>
  );
}
