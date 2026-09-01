import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { localeAlternates } from "@/i18n/alternates";

export async function helpArticleMetadata(id: string, href: string) {
  const t = await getTranslations(`help.${id}`);
  return {
    title: t("title"),
    description: t("summary"),
    alternates: localeAlternates(href),
  };
}

export async function HelpArticleFrame({
  articleId,
  children,
}: {
  articleId: string;
  children: ReactNode;
}) {
  const t = await getTranslations(`help.${articleId}`);
  const ti = await getTranslations("helpIndex");
  const tn = await getTranslations("nav");
  return (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">{ti("kicker")}</p>
      <p className="mt-2">
        <Link href="/help" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← {tn("helpAll")}
        </Link>
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
      {children}
    </>
  );
}
