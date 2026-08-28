"use client";

import { useEffect, useState } from "react";
import { matchMediaCache, putMediaCache } from "@/lib/mediaBrowserCache";

/** Load a same-origin media preview URL into a blob object URL, with Cache Storage. */
export function useMediaBlob(previewUrl: string) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setSrc(null);

    async function load() {
      const cached = await matchMediaCache(previewUrl);
      if (cached) {
        objectUrl = URL.createObjectURL(cached);
        if (!cancelled) {
          setSrc(objectUrl);
          setLoading(false);
        }
        return;
      }

      const response = await fetch(previewUrl, { credentials: "same-origin" });
      if (!response.ok) {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
        return;
      }
      const blob = await response.blob();
      await putMediaCache(previewUrl, blob);
      objectUrl = URL.createObjectURL(blob);
      if (!cancelled) {
        setSrc(objectUrl);
        setLoading(false);
      }
    }

    void load().catch(() => {
      if (!cancelled) {
        setFailed(true);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [previewUrl]);

  return { src, failed, loading };
}
