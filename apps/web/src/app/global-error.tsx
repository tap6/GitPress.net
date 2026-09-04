"use client";

import { useEffect } from "react";
import { AppErrorFallback } from "@/components/AppErrorFallback";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AppErrorFallback reset={reset} />
      </body>
    </html>
  );
}
