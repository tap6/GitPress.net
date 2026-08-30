"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { BUILD_TRIGGER_EVENT, type BuildTriggerDetail } from "./buildTriggerEvent";

interface Props {
  children: React.ReactNode;
  /** Label shown while the request is in flight (elapsed seconds appended automatically). */
  pendingLabel?: string;
  /** Rough duration this action usually takes — drives the fill speed of the progress bar. */
  expectedSeconds?: number;
  className?: string;
  disabled?: boolean;
  /**
   * Set this to the site id when the action commits to the data repo (which
   * is almost every mutating action here — save post, switch theme, upload
   * media, etc.). The commit itself usually finishes in ~1s, which is why
   * these buttons used to feel like they "did nothing" — the real work (the
   * GitHub Actions build) starts *after* that. Passing this fires a global
   * event once the request resolves so the sticky `BuildStatusBar` picks up
   * the newly queued run and shows real progress for the next 1–2 minutes.
   */
  buildSiteId?: string;
}

/**
 * Submit button with a real, visible progress-bar element rendered under it
 * while the form is submitting — not just a spinning mouse cursor. Server
 * actions give no real progress events, so the bar is "fake-determinate": it
 * races to ~92% over `expectedSeconds` and then creeps slowly so it never
 * looks stuck, while the label shows exactly how many seconds have elapsed.
 */
export function ProgressButton({
  children,
  pendingLabel,
  expectedSeconds = 6,
  className = "",
  disabled,
  buildSiteId,
}: Props) {
  const { pending } = useFormStatus();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (!pending) {
      setElapsedMs(0);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - start), 100);
    return () => clearInterval(timer);
  }, [pending]);

  // Fires once per completed submission (pending: true -> false).
  useEffect(() => {
    if (wasPending.current && !pending) {
      if (buildSiteId) {
        window.dispatchEvent(
          new CustomEvent<BuildTriggerDetail>(BUILD_TRIGGER_EVENT, {
            detail: { siteId: buildSiteId },
          }),
        );
      }
      setJustSubmitted(true);
      const timeout = setTimeout(() => setJustSubmitted(false), 1800);
      wasPending.current = pending;
      return () => clearTimeout(timeout);
    }
    wasPending.current = pending;
  }, [pending, buildSiteId]);

  const elapsedSeconds = elapsedMs / 1000;
  const ramp = Math.min(92, (elapsedSeconds / expectedSeconds) * 92);
  const creep = Math.min(6, Math.max(0, elapsedSeconds - expectedSeconds) * 0.6);
  const progress = pending ? ramp + creep : 0;

  return (
    <span className="inline-flex flex-col items-stretch gap-1">
      <button type="submit" disabled={pending || disabled} className={className}>
        {pending
          ? `${pendingLabel ?? "处理中"}…(${elapsedSeconds.toFixed(0)}s)`
          : justSubmitted
            ? "✓ 已提交"
            : children}
      </button>
      {pending && (
        <span
          className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span
            className="block h-full rounded-full bg-wp-accent transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </span>
      )}
      {justSubmitted && buildSiteId && (
        <span className="text-[11px] text-neutral-400">已提交,网站构建中,可离开本页</span>
      )}
    </span>
  );
}
