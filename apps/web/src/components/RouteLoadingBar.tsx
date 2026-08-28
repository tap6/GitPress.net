"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Thin animated progress line for admin page navigations. App Router doesn't
 * expose a "navigation started" event to hooks (pathname/searchParams only
 * change once the new route has already rendered), so we get the *start*
 * signal from the click itself — capturing clicks on internal links fires
 * before any network/server work happens, which is exactly when the user
 * needs feedback that something is happening. The *end* signal comes from
 * the pathname/searchParams actually changing to the new route.
 */
export function RouteLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const prevKey = useRef(routeKey);

  useEffect(() => {
    if (prevKey.current !== routeKey) {
      prevKey.current = routeKey;
      setLoading(false);
    }
  }, [routeKey]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) {
        return;
      }
      if (anchor.target === "_blank") return;
      if (href === pathname) return;
      setLoading(true);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="h-0.5 w-full overflow-hidden bg-sky-100">
      <div className="route-loading-bar-fill h-full w-1/3 bg-sky-500" />
    </div>
  );
}
