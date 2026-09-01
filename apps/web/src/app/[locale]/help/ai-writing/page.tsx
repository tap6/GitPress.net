import { getLocale } from "next-intl/server";
import { HelpArticleFrame, helpArticleMetadata } from "@/components/HelpArticleFrame";
import { AiWritingEn } from "@/content/help/ai-writing-en";
import { AiWritingZh } from "@/content/help/ai-writing-zh";

export async function generateMetadata() {
  return helpArticleMetadata("aiWriting", "/help/ai-writing");
}

export default async function AiWritingHelpPage() {
  const locale = await getLocale();
  return (
    <HelpArticleFrame articleId="aiWriting">
      {locale === "en" ? <AiWritingEn /> : <AiWritingZh />}
    </HelpArticleFrame>
  );
}
