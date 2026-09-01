import { getTranslations } from "next-intl/server";
import { HelpSearch } from "@/components/HelpSearch";
import { localeAlternates } from "@/i18n/alternates";
import { HELP_ARTICLES } from "@/lib/helpArticles";

export async function generateMetadata() {
  const t = await getTranslations("helpIndex");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localeAlternates("/help"),
  };
}

export default async function HelpIndexPage() {
  const t = await getTranslations("helpIndex");
  return (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">{t("kicker")}</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="mt-4 leading-relaxed text-neutral-500">{t("lead")}</p>
      <div className="mt-8">
        <HelpSearch articles={HELP_ARTICLES} />
      </div>
    </>
  );
}
