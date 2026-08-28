"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { adminNavHrefs } from "@/components/AdminMenu";

/**
 * Warm the App Router cache for sibling admin tabs after first paint.
 * Combined with `experimental.staleTimes.dynamic`, revisits skip a GitHub
 * round-trip. We stagger and skip Save-Data / 2G so this cannot stampede
 * the API the moment the dashboard mounts.
 */
export function IdleRoutePrefetch({ siteId }: { siteId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const warmed = useRef(new Set<string>());

  useEffect(() => {
    warmed.current.clear();
  }, [siteId]);

  useEffect(() => {
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (connection?.saveData) return;
    if (connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") return;

    const hrefs = adminNavHrefs(siteId).filter((href) => href !== pathname);
    let index = 0;
    let cancelled = false;
    const timers: number[] = [];

    function arm(delay: number, fn: () => void) {
      const id = window.setTimeout(fn, delay);
      timers.push(id);
    }

    function schedule() {
      if (cancelled || index >= hrefs.length) return;
      while (index < hrefs.length && warmed.current.has(hrefs[index])) index += 1;
      if (index >= hrefs.length) return;
      const href = hrefs[index];
      index += 1;
      warmed.current.add(href);
      router.prefetch(href);
      arm(350, schedule);
    }

    const start = () => {
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") {
        const idleId = ric(schedule, { timeout: 2500 });
        return () => {
          if (typeof window.cancelIdleCallback === "function") {
            window.cancelIdleCallback(idleId);
          }
        };
      }
      arm(400, schedule);
      return () => undefined;
    };

    let cancelIdle: () => void = () => undefined;
    arm(900, () => {
      cancelIdle = start();
    });

    return () => {
      cancelled = true;
      cancelIdle();
      for (const id of timers) window.clearTimeout(id);
    };
  }, [pathname, router, siteId]);

  return null;
}
