import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { localeAlternates } from "@/i18n/alternates";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { PrivacyEn } from "@/content/privacy-en";
import { PrivacyZh } from "@/content/privacy-zh";

export async function generateMetadata() {
  const t = await getTranslations("help.privacy");
  return {
    title: t("title"),
    description: t("summary"),
    alternates: localeAlternates("/privacy"),
  };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const tn = await getTranslations("nav");
  const tw = await getTranslations("help.whatIs");

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Git<span className="text-gp-brand">Press</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-neutral-500">
            <Link href="/help/what-is-gitpress" className="hover:text-neutral-900">
              {tw("nav")}
            </Link>
            <Link href="/help" className="hover:text-neutral-900">
              {tn("help")}
            </Link>
            <Link href="/" className="hover:text-neutral-900">
              {tn("helpHome")}
            </Link>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-12">
        {locale === "en" ? <PrivacyEn /> : <PrivacyZh />}
      </main>
    </div>
  );
}
