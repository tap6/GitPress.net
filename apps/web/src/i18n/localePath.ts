import type { AppLocale } from "./routing";

/** Middleware copies the public path here so Server Components can redirect. */
export const PRODUCT_PATHNAME_HEADER = "x-gitpress-pathname";

export function localePrefixOf(pathname: string): AppLocale | null {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/zh" || pathname.startsWith("/zh/")) return "zh";
  return null;
}

/** Drop `/en` or `/zh` from a path (query string preserved). */
export function stripLocalePrefix(pathWithSearch: string): string {
  const q = pathWithSearch.indexOf("?");
  const pathname = q >= 0 ? pathWithSearch.slice(0, q) : pathWithSearch;
  const search = q >= 0 ? pathWithSearch.slice(q) : "";
  const prefix = localePrefixOf(pathname);
  let rest = pathname;
  if (prefix) {
    rest = pathname.slice(prefix.length + 1);
    if (!rest) rest = "/";
    else if (!rest.startsWith("/")) rest = `/${rest}`;
  }
  return `${rest || "/"}${search}`;
}

/** `as-needed` URLs: Chinese is unprefixed, English is `/en`. */
export function prefixLocalePath(pathname: string, locale: AppLocale): string {
  const rest = stripLocalePrefix(pathname.split("?")[0] || "/");
  if (locale === "zh") return rest;
  return rest === "/" ? "/en" : `/en${rest}`;
}

export function callbackPathPrefersEnglish(callbackUrl: string | null): boolean {
  if (!callbackUrl) return false;
  try {
    const path =
      callbackUrl.startsWith("http://") || callbackUrl.startsWith("https://")
        ? new URL(callbackUrl).pathname
        : callbackUrl.startsWith("/")
          ? callbackUrl.split("?")[0]
          : "";
    return localePrefixOf(path) === "en";
  } catch {
    return false;
  }
}
