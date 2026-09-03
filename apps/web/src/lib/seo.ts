import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { localeAlternates } from "@/i18n/alternates";
import type { AppLocale } from "@/i18n/routing";
import { absoluteAsset, dashboardImagePath, shareImagePath, SITE_URL } from "@/lib/siteUrl";

export const noIndexRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false, noimageindex: true },
};

export function noIndexMetadata(title?: string): Metadata {
  return {
    title,
    robots: noIndexRobots,
  };
}

export function shareImageMeta(locale: AppLocale) {
  const url = shareImagePath(locale);
  return {
    url,
    width: 1200,
    height: 630,
    alt: locale === "en" ? "GitPress admin dashboard" : "GitPress 后台仪表盘",
  };
}

export async function publicMetadata(options: {
  href: string;
  title: string;
  description: string;
  locale?: AppLocale;
}): Promise<Metadata> {
  const locale = (options.locale ?? ((await getLocale()) as AppLocale)) as AppLocale;
  const alternates = localeAlternates(options.href, locale);
  const ogLocale = locale === "en" ? "en_US" : "zh_CN";
  const image = shareImageMeta(locale);
  const imageAbs = absoluteAsset(image.url);
  return {
    title: options.title,
    description: options.description,
    alternates: {
      ...alternates,
      types: { "text/plain": "/llms.txt" },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      alternateLocale: locale === "en" ? ["zh_CN"] : ["en_US"],
      url: alternates.canonical,
      siteName: "GitPress",
      title: options.title,
      description: options.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [image.url],
    },
    other: {
      image: imageAbs,
    },
  };
}

function logoObject() {
  return {
    "@type": "ImageObject" as const,
    "@id": `${SITE_URL}/#logo`,
    url: absoluteAsset("/brand/logo.png"),
    contentUrl: absoluteAsset("/brand/logo.png"),
    width: 1024,
    height: 1024,
    caption: "GitPress",
  };
}

function shareObject(locale: AppLocale) {
  const url = absoluteAsset(shareImagePath(locale));
  return {
    "@type": "ImageObject" as const,
    url,
    contentUrl: url,
    width: 1200,
    height: 630,
    caption: locale === "en" ? "GitPress admin dashboard" : "GitPress 后台仪表盘",
  };
}

export function softwareJsonLd(options: { name: string; description: string; locale: AppLocale }) {
  const url = options.locale === "en" ? `${SITE_URL}/en` : SITE_URL;
  const share = shareObject(options.locale);
  const screenshot = absoluteAsset(dashboardImagePath(options.locale));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: "GitPress",
        url: SITE_URL,
        logo: logoObject(),
        image: logoObject(),
        sameAs: [
          "https://github.com/tap6/GitPress.net",
          "https://github.com/tap6/gitpress",
          "https://github.com/tap6/build-action",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "GitPress.net",
        url: SITE_URL,
        inLanguage: ["zh-CN", "en"],
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "WebPage",
        "@id": `${url}/#webpage`,
        url,
        name: options.name,
        description: options.description,
        inLanguage: options.locale === "en" ? "en" : "zh-CN",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#app` },
        primaryImageOfPage: share,
        image: share,
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: options.name,
        url,
        description: options.description,
        applicationCategory: "BloggingApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        image: share,
        screenshot,
        mainEntityOfPage: { "@id": `${url}/#webpage` },
        publisher: { "@id": `${SITE_URL}/#org` },
      },
    ],
  };
}

export function articleJsonLd(options: {
  title: string;
  description: string;
  url: string;
  locale: AppLocale;
}) {
  const share = shareObject(options.locale);
  return {
    "@context": "https://schema.org",
    "@type": ["TechArticle", "WebPage"],
    headline: options.title,
    name: options.title,
    description: options.description,
    url: options.url,
    inLanguage: options.locale === "en" ? "en" : "zh-CN",
    image: share,
    primaryImageOfPage: share,
    publisher: {
      "@type": "Organization",
      name: "GitPress",
      url: SITE_URL,
      logo: logoObject(),
    },
  };
}
