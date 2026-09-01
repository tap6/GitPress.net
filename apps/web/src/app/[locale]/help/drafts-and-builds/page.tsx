import { getLocale } from "next-intl/server";
import { HelpArticleFrame, helpArticleMetadata } from "@/components/HelpArticleFrame";
import { DraftsEn } from "@/content/help/drafts-en";
import { DraftsZh } from "@/content/help/drafts-zh";

export async function generateMetadata() {
  return helpArticleMetadata("drafts", "/help/drafts-and-builds");
}

export default async function DraftsAndBuildsHelpPage() {
  const locale = await getLocale();
  return (
    <HelpArticleFrame articleId="drafts">{locale === "en" ? <DraftsEn /> : <DraftsZh />}</HelpArticleFrame>
  );
}
