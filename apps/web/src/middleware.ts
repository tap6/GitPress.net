import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import {
  PRODUCT_PATHNAME_HEADER,
  callbackPathPrefersEnglish,
  localePrefixOf,
  prefixLocalePath,
} from "./i18n/localePath";

const intlMiddleware = createMiddleware(routing);

const LOCALE_COOKIE = "NEXT_LOCALE";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** First tag only. `fr-FR,en;q=0.8` must not count as English. */
function prefersEnglish(header: string | null): boolean {
  if (!header) return false;
  const primary = header.split(",")[0]?.trim().split(";")[0]?.trim().toLowerCase();
  if (!primary) return false;
  return primary === "en" || primary.startsWith("en-");
}

function stampLocaleCookie(response: NextResponse, locale: "en" | "zh"): void {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
  });
}

function redirectToPrefixed(
  request: NextRequest,
  locale: "en",
  pathname: string,
  setCookie: boolean,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = prefixLocalePath(pathname, locale);
  const response = NextResponse.redirect(url);
  if (setCookie) stampLocaleCookie(response, locale);
  return response;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  request.headers.set(PRODUCT_PATHNAME_HEADER, `${pathname}${request.nextUrl.search}`);

  const method = request.method;
  const canRedirect = method === "GET" || method === "HEAD";
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const pathLocale = localePrefixOf(pathname);

  if (canRedirect) {
    if (pathname === "/" && cookie !== "en" && cookie !== "zh") {
      if (prefersEnglish(request.headers.get("accept-language"))) {
        return redirectToPrefixed(request, "en", "/", true);
      }
    }

    if (cookie === "en" && pathLocale !== "en") {
      return redirectToPrefixed(request, "en", pathname, false);
    }

    if (
      (pathname === "/login" || pathname === "/login/") &&
      pathLocale !== "en" &&
      cookie !== "zh" &&
      callbackPathPrefersEnglish(request.nextUrl.searchParams.get("callbackUrl"))
    ) {
      return redirectToPrefixed(request, "en", "/login", true);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(zh|en)/:path*", "/((?!api|theme-previews|_next|_vercel|.*\\..*).*)"],
};
