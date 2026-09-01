import { getLocale } from "next-intl/server";
import { HelpArticleFrame, helpArticleMetadata } from "@/components/HelpArticleFrame";
import { MakeThemeEn } from "@/content/help/make-theme-en";
import { MakeThemeZh } from "@/content/help/make-theme-zh";

export async function generateMetadata() {
  return helpArticleMetadata("makeTheme", "/help/make-theme");
}

export default async function MakeThemeHelpPage() {
  const locale = await getLocale();
  return (
    <HelpArticleFrame articleId="makeTheme">
      {locale === "en" ? <MakeThemeEn /> : <MakeThemeZh />}
    </HelpArticleFrame>
  );
}
