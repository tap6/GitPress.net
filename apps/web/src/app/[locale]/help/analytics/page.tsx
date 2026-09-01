import { getLocale } from "next-intl/server";
import { HelpArticleFrame, helpArticleMetadata } from "@/components/HelpArticleFrame";
import { AnalyticsEn } from "@/content/help/analytics-en";
import { AnalyticsZh } from "@/content/help/analytics-zh";

export async function generateMetadata() {
  return helpArticleMetadata("analytics", "/help/analytics");
}

export default async function AnalyticsHelpPage() {
  const locale = await getLocale();
  return (
    <HelpArticleFrame articleId="analytics">
      {locale === "en" ? <AnalyticsEn /> : <AnalyticsZh />}
    </HelpArticleFrame>
  );
}
