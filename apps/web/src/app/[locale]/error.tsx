"use client";

import { useEffect } from "react";
import { AppErrorFallback } from "@/components/AppErrorFallback";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <AppErrorFallback reset={reset} />;
}
