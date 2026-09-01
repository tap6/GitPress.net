"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

/**
 * Ticking "运行中… Ns" counter for a workflow run that hasn't concluded yet,
 * so the user sees time actually passing instead of a static "进行中…" label.
 */
export function RunElapsed({ createdAt }: { createdAt: string }) {
  const t = useTranslations("buildBar");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
  return <span>{t("running", { n: seconds })}</span>;
}

/**
 * While a build is in progress, silently refresh the server-rendered page
 * every few seconds so the run list / elapsed counters update on their own —
 * no manual reload needed to find out a build finished.
 */
export function BuildStatusPoller({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [active, router]);
  return null;
}
