"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export function HelpHeaderNav() {
  const pathname = usePathname();
  const onIndex = pathname === "/help";
  const t = useTranslations("nav");

  return (
    <div className="flex items-center gap-4 text-sm text-neutral-500">
      {!onIndex ? (
        <Link href="/help" className="hover:text-neutral-900">
          {t("helpAll")}
        </Link>
      ) : null}
      <Link href="/" className="hover:text-neutral-900">
        {t("helpHome")}
      </Link>
      <LocaleSwitcher />
    </div>
  );
}
