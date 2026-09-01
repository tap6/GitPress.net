import { getLocale } from "next-intl/server";
import { HelpArticleFrame, helpArticleMetadata } from "@/components/HelpArticleFrame";
import { BuildsEn } from "@/content/help/builds-en";
import { BuildsZh } from "@/content/help/builds-zh";

export async function generateMetadata() {
  return helpArticleMetadata("builds", "/help/builds");
}

export default async function BuildsHelpPage() {
  const locale = await getLocale();
  return (
    <HelpArticleFrame articleId="builds">{locale === "en" ? <BuildsEn /> : <BuildsZh />}</HelpArticleFrame>
  );
}
