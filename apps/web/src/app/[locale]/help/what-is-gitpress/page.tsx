import { getLocale } from "next-intl/server";
import { HelpArticleFrame, helpArticleMetadata } from "@/components/HelpArticleFrame";
import { WhatIsEn } from "@/content/help/what-is-en";
import { WhatIsZh } from "@/content/help/what-is-zh";

export async function generateMetadata() {
  return helpArticleMetadata("whatIs", "/help/what-is-gitpress");
}

export default async function WhatIsGitPressHelpPage() {
  const locale = await getLocale();
  return (
    <HelpArticleFrame articleId="whatIs">{locale === "en" ? <WhatIsEn /> : <WhatIsZh />}</HelpArticleFrame>
  );
}
