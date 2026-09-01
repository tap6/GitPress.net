"use client";

import { useTranslations } from "next-intl";
import type { ThemeBadgeKind } from "@/lib/themeShelf";

export function ThemeBadgeMark({ badge }: { badge: ThemeBadgeKind | null }) {
  const t = useTranslations("themeShelf");
  if (!badge) return null;
  return (
    <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white">
      {badge === "official" ? t("official") : t("listed")}
    </span>
  );
}
