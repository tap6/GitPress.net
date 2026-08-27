"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

interface Props {
  children: React.ReactNode;
  /** Label shown while the request is in flight (elapsed seconds appended automatically). */
  pendingLabel?: string;
  /** Rough duration this action usually takes — drives the fill speed of the progress bar. */
  expectedSeconds?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Submit button that fills with a "fake-determinate" progress bar while its
 * form is submitting, plus a live elapsed-time counter. Server actions give
 * no real progress events, so this races to ~92% over `expectedSeconds` and
 * then creeps slowly — it never looks stuck, and the counter tells the user
 * exactly how long they have already waited instead of leaving them guessing.
 */
export function ProgressButton({
  children,
  pendingLabel,
  expectedSeconds = 6,
  className = "",
  disabled,
}: Props) {
  const { pending } = useFormStatus();
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!pending) {
      setElapsedMs(0);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - start), 100);
    return () => clearInterval(timer);
  }, [pending]);

  const elapsedSeconds = elapsedMs / 1000;
  const ramp = Math.min(92, (elapsedSeconds / expectedSeconds) * 92);
  const creep = Math.min(6, Math.max(0, elapsedSeconds - expectedSeconds) * 0.6);
  const progress = pending ? ramp + creep : 0;

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`relative isolate overflow-hidden disabled:cursor-wait disabled:opacity-100 ${className}`}
    >
      {pending && (
        <span
          className="absolute inset-y-0 left-0 -z-10 bg-black/15 transition-[width] duration-150 ease-linear"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      )}
      <span className="relative">
        {pending
          ? `${pendingLabel ?? "处理中…"}(${elapsedSeconds.toFixed(0)}s)`
          : children}
      </span>
    </button>
  );
}
