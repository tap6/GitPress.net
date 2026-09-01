import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/** First tag only. `fr-FR,en;q=0.8` must not count as English. */
function prefersEnglish(header: string | null): boolean {
  if (!header) return false;
  const primary = header.split(",")[0]?.trim().split(";")[0]?.trim().toLowerCase();
  if (!primary) return false;
  return primary === "en" || primary.startsWith("en-");
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const cookie = request.cookies.get("NEXT_LOCALE")?.value;
    if (cookie === "en" || ((cookie === undefined || cookie === "") && prefersEnglish(request.headers.get("accept-language")))) {
      const url = request.nextUrl.clone();
      url.pathname = "/en";
      return Response.redirect(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(zh|en)/:path*", "/((?!api|theme-previews|_next|_vercel|.*\\..*).*)"],
};
