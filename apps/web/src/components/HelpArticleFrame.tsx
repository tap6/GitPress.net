import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { Link } from "@/i18n/navigation";
import { localeAlternates } from "@/i18n/alternates";
import type { AppLocale } from "@/i18n/routing";
import { HELP_ARTICLES } from "@/lib/helpArticles";
import { articleJsonLd, publicMetadata } from "@/lib/seo";

export async function helpArticleMetadata(id: string, href: string) {
  const t = await getTranslations(`help.${id}`);
  return publicMetadata({ href, title: t("title"), description: t("summary") });
}

export async function HelpArticleFrame({
  articleId,
  children,
}: {
  articleId: string;
  children: ReactNode;
}) {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations(`help.${articleId}`);
  const ti = await getTranslations("helpIndex");
  const tn = await getTranslations("nav");
  const href = HELP_ARTICLES.find((item) => item.id === articleId)?.href ?? "/help";
  const canonical = localeAlternates(href, locale).canonical;
  return (
    <>
      <JsonLd
        data={articleJsonLd({
          title: t("title"),
          description: t("summary"),
          url: canonical,
          locale,
        })}
      />
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
