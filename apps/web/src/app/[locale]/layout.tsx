import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { htmlLang, routing } from "@/i18n/routing";
import { shareImagePath, SITE_URL } from "@/lib/siteUrl";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const ogLocale = locale === "en" ? "en_US" : "zh_CN";
  const share = shareImagePath(locale);
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: "GitPress",
    title: {
      default: t("title"),
      template: t("titleTemplate"),
    },
    description: t("description"),
    keywords: t("keywords")
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean),
    authors: [{ name: "GitPress", url: SITE_URL }],
    creator: "GitPress",
    publisher: "GitPress",
    category: "technology",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icon.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      alternateLocale: locale === "en" ? ["zh_CN"] : ["en_US"],
      siteName: "GitPress",
      title: t("title"),
      description: t("description"),
      images: [{ url: share, width: 1200, height: 630, alt: "GitPress" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [share],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={htmlLang(locale)}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
