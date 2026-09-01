import { getLocale } from "next-intl/server";
import { HelpArticleFrame, helpArticleMetadata } from "@/components/HelpArticleFrame";
import { ImportThemeEn } from "@/content/help/import-theme-en";
import { ImportThemeZh } from "@/content/help/import-theme-zh";

export async function generateMetadata() {
  return helpArticleMetadata("importTheme", "/help/import-theme");
}

export default async function ImportThemeHelpPage() {
  const locale = await getLocale();
  return (
    <HelpArticleFrame articleId="importTheme">
      {locale === "en" ? <ImportThemeEn /> : <ImportThemeZh />}
    </HelpArticleFrame>
  );
}
