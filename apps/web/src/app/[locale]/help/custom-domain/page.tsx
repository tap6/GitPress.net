import { getLocale } from "next-intl/server";
import { HelpArticleFrame, helpArticleMetadata } from "@/components/HelpArticleFrame";
import { CustomDomainEn } from "@/content/help/custom-domain-en";
import { CustomDomainZh } from "@/content/help/custom-domain-zh";

export async function generateMetadata() {
  return helpArticleMetadata("domain", "/help/custom-domain");
}

export default async function CustomDomainHelpPage() {
  const locale = await getLocale();
  return (
    <HelpArticleFrame articleId="domain">
      {locale === "en" ? <CustomDomainEn /> : <CustomDomainZh />}
    </HelpArticleFrame>
  );
}
