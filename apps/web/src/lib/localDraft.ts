"use client";

import { useEffect, useRef, useState } from "react";

export interface LocalDraftFields {
  title: string;
  slug: string;
  date: string;
  draft: boolean;
  tags: string;
  category: string;
  description: string;
  body: string;
}

/** Title and body both blank — not worth a local backup (or a restore prompt). */
export function isEmptyDraft(fields: Pick<LocalDraftFields, "title" | "body">): boolean {
  const title = fields.title.trim();
  const body = fields.body
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .trim();
  return title.length === 0 && body.length === 0;
}

interface StoredDraft extends LocalDraftFields {
  savedAt: number;
}

const PREFIX = "gitpress.local-draft.v1";

function storageKey(siteId: string, path: string): string {
  return `${PREFIX}:${siteId}:${path || "new"}`;
}

function normalizeDraft(fields: LocalDraftFields): LocalDraftFields {
  return {
    title: fields.title.trim(),
    slug: fields.slug.trim(),
    date: fields.date.trim(),
    draft: fields.draft,
    tags: fields.tags.trim(),
    category: fields.category.trim(),
    description: fields.description.trim(),
    body: fields.body.replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, ""),
  };
}

function fingerprint(fields: LocalDraftFields): string {
  return JSON.stringify(normalizeDraft(fields));
}

function readDraft(key: string): StoredDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed || typeof parsed.body !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft(key: string, fields: LocalDraftFields): boolean {
  if (isEmptyDraft(fields)) {
    clearDraft(key);
    return true;
  }
  try {
    const payload: StoredDraft = { ...fields, savedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function clearDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export interface LocalDraftController {
  /** A leftover draft from a previous visit that differs from the server copy. */
  pending: StoredDraft | null;
  /** True only after the user changed something vs the server snapshot. */
  dirty: boolean;
  persistOk: boolean;
  lastSavedAt: number | null;
  restorePending: () => void;
  discardPending: () => void;
  /** Call right before a GitHub save: drop the local copy so a successful redirect doesn't revive it. */
  clearForSubmit: () => void;
  /** Call if the GitHub save failed, so the in-progress text is kept. */
  persistNow: () => void;
}

/**
 * Browser-local safety net for the post editor. Content is committed to GitHub
 * only on explicit save; switching tabs, refreshing, or a closed laptop
 * should not wipe an in-progress post. localStorage is enough for Markdown
 * (typically well under the ~5MB quota); we do not use IndexedDB so this
 * stays synchronous and recoverable even if the tab is killed mid-write.
 */
export function useLocalPostDraft(
  siteId: string,
  path: string,
  fields: LocalDraftFields,
  apply: (fields: LocalDraftFields) => void,
): LocalDraftController {
  const key = storageKey(siteId, path);
  const fieldsFp = fingerprint(fields);
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const applyRef = useRef(apply);
  applyRef.current = apply;
  // Snapshot after layout (date TZ conversion), not on the first render.
  const serverFingerprintRef = useRef<string | null>(null);
  const persistEnabledRef = useRef(false);

  const [pending, setPending] = useState<StoredDraft | null>(null);
  const [persistEnabled, setPersistEnabled] = useState(false);
  const [persistOk, setPersistOk] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [armed, setArmed] = useState(false);

  function setPersist(value: boolean) {
    persistEnabledRef.current = value;
    setPersistEnabled(value);
  }

  function matchesServer(current: LocalDraftFields): boolean {
    const baseline = serverFingerprintRef.current;
    return baseline != null && fingerprint(current) === baseline;
  }

  useEffect(() => {
    serverFingerprintRef.current = null;
    setPending(null);
    setPersist(false);
    setArmed(false);

    const stored = readDraft(key);
    if (stored && isEmptyDraft(stored)) clearDraft(key);

    // useLayoutEffect in the editor has already corrected the date by now.
    const baseline = fingerprint(fieldsRef.current);
    serverFingerprintRef.current = baseline;
    const leftover = stored && !isEmptyDraft(stored) ? stored : null;
    if (leftover && fingerprint(leftover) !== baseline) {
      setPending(leftover);
      setPersist(false);
    } else {
      if (leftover) clearDraft(key);
      setPersist(true);
    }
    setArmed(true);
    return () => {
      setArmed(false);
      persistEnabledRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!armed || !pending) return;
    if (!matchesServer(fieldsRef.current)) {
      // Real user edits while a restore offer is showing: keep the new work.
      setPending(null);
      setPersist(true);
    }
  }, [armed, fieldsFp, pending]);

  useEffect(() => {
    if (!persistEnabled) return;
    const timer = window.setTimeout(() => {
      if (!persistEnabledRef.current) return;
      const current = fieldsRef.current;
      if (isEmptyDraft(current) || matchesServer(current)) {
        clearDraft(key);
        setPersistOk(true);
        setLastSavedAt(null);
        return;
      }
      const ok = writeDraft(key, current);
      setPersistOk(ok);
      if (ok) setLastSavedAt(Date.now());
    }, 800);
    return () => window.clearTimeout(timer);
  }, [fieldsFp, key, persistEnabled]);

  useEffect(() => {
    function flush() {
      if (!persistEnabledRef.current) return;
      const current = fieldsRef.current;
      if (isEmptyDraft(current) || matchesServer(current)) {
        clearDraft(key);
        setLastSavedAt(null);
        return;
      }
      const ok = writeDraft(key, current);
      setPersistOk(ok);
      if (ok) setLastSavedAt(Date.now());
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [key]);

  return {
    pending,
    dirty: persistEnabled && serverFingerprintRef.current != null && fieldsFp !== serverFingerprintRef.current,
    persistOk,
    lastSavedAt,
    restorePending() {
      if (!pending) return;
      applyRef.current(pending);
      setPending(null);
      setPersist(true);
    },
    discardPending() {
      clearDraft(key);
      setPending(null);
      setPersist(true);
    },
    clearForSubmit() {
      setPersist(false);
      clearDraft(key);
      setLastSavedAt(null);
    },
    persistNow() {
      const current = fieldsRef.current;
      if (isEmptyDraft(current) || matchesServer(current)) {
        clearDraft(key);
        setPersistOk(true);
        setLastSavedAt(null);
        setPersist(true);
        return;
      }
      const ok = writeDraft(key, current);
      setPersistOk(ok);
      if (ok) setLastSavedAt(Date.now());
      setPersist(true);
    },
  };
}
