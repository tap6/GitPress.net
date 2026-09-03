import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { absoluteUrl } from "@/i18n/alternates";
import type { AppLocale } from "@/i18n/routing";
import { HELP_ARTICLES } from "@/lib/helpArticles";
import { dashboardImagePath, shareImagePath, SITE_URL } from "@/lib/siteUrl";

const LOCALES: AppLocale[] = ["zh", "en"];

const PUBLIC_HREFS = ["/", "/help", "/login", ...HELP_ARTICLES.map((item) => item.href)] as const;

function pathFor(href: string, locale: AppLocale): string {
  return getPathname({ href: href as never, locale });
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = PUBLIC_HREFS.flatMap((href) =>
    LOCALES.map((locale) => {
      const share = `${SITE_URL}${shareImagePath(locale)}`;
      const images = href === "/" ? [share, `${SITE_URL}${dashboardImagePath(locale)}`] : [share];
      return {
        url: absoluteUrl(pathFor(href, locale)),
        lastModified: now,
        changeFrequency: href === "/" ? "weekly" : "monthly",
        priority: href === "/" ? 1 : href === "/help/what-is-gitpress" ? 0.9 : 0.7,
        images,
        alternates: {
          languages: {
            "zh-CN": absoluteUrl(pathFor(href, "zh")),
            en: absoluteUrl(pathFor(href, "en")),
            "x-default": absoluteUrl(pathFor(href, "zh")),
          },
        },
      };
    }),
  );
  pages.push({
    url: `${SITE_URL}/llms.txt`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.4,
  });
  return pages;
}
