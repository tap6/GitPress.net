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
    <span className="inline-flex flex-col items-stretch gap-1">
      <button type="submit" disabled={pending || disabled} className={className}>
        {pending
          ? `${pendingLabel ?? "处理中"}…(${elapsedSeconds.toFixed(0)}s)`
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
    </span>
  );
}
