"use client";

import { useEffect, useRef, useState } from "react";
import { getBuildStatusAction, type BuildStatusSnapshot } from "@/lib/actions";
import { describeBuildTrigger } from "@/lib/buildLabels";
import { BUILD_TRIGGER_EVENT, type BuildTriggerDetail } from "./buildTriggerEvent";

type Phase = "hidden" | "submitting" | "building" | "success" | "failure" | "unknown";

/** Rough historical duration of a GitPress build (Astro build + Pages deploy). */
const EXPECTED_BUILD_SECONDS = 90;

interface Props {
  siteId: string;
  dataRepo: string;
}

/**
 * Sticky notice, mounted once in the site admin layout, that turns the
 * previously-invisible "commit succeeded, build starts later" gap into a
 * real, continuously-updating status: as soon as any ProgressButton on any
 * admin page finishes a build-triggering action, this starts watching the
 * data repo's Actions runs (polling every few seconds) and shows elapsed
 * time until the run concludes — instead of the button flashing for under a
 * second and leaving no trace that anything is happening.
 */
export function BuildStatusBar({ siteId, dataRepo }: Props) {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [snapshot, setSnapshot] = useState<BuildStatusSnapshot | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const phaseRef = useRef<Phase>("hidden");
  const watchedRunId = useRef<number | undefined>(undefined);
  const startedAtRef = useRef<number>(Date.now());
  const permissionMissingRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  async function poll() {
    let result: BuildStatusSnapshot;
    try {
      result = await getBuildStatusAction(siteId);
    } catch {
      return;
    }
    setSnapshot(result);

    if (result.actionsPermissionMissing) {
      permissionMissingRef.current = true;
      if (phaseRef.current === "submitting" || phaseRef.current === "building") {
        setPhase("unknown");
      }
      return;
    }
    permissionMissingRef.current = false;

    if (result.status === "queued" || result.status === "in_progress") {
      if (watchedRunId.current !== result.runId) {
        watchedRunId.current = result.runId;
        startedAtRef.current = result.createdAt ? new Date(result.createdAt).getTime() : Date.now();
      }
      setPhase("building");
      return;
    }

    // Guard against matching a *previous* already-concluded run that's still
    // "latest" because the new run hasn't been registered by GitHub yet
    // (there's usually a couple seconds of lag between push and run
    // creation) — without this, re-triggering a build right after a prior
    // success/failure would instantly (and wrongly) flash that old result.
    const runCreatedAfterWeStartedWatching =
      result.createdAt != null && new Date(result.createdAt).getTime() >= startedAtRef.current - 5000;
    const isWatchedRun =
      result.runId != null &&
      (result.runId === watchedRunId.current ||
        (watchedRunId.current === undefined && runCreatedAfterWeStartedWatching));
    const wasWatching = phaseRef.current === "building" || phaseRef.current === "submitting";
    if (wasWatching && isWatchedRun) {
      if (result.status === "success") {
        setPhase("success");
        setTimeout(() => setPhase((p) => (p === "success" ? "hidden" : p)), 6000);
      } else if (result.status === "failure") {
        setPhase("failure");
      } else {
        setPhase("hidden");
      }
    }
    // status === "idle" or an unrelated concluded run: nothing to announce.
  }

  // A ProgressButton anywhere in the admin just finished a build-triggering
  // submission — start watching immediately rather than waiting for the
  // next background poll tick.
  useEffect(() => {
    function onTrigger(event: Event) {
      const detail = (event as CustomEvent<BuildTriggerDetail>).detail;
      if (detail?.siteId !== siteId) return;
      setPhase("submitting");
      startedAtRef.current = Date.now();
      watchedRunId.current = undefined;
      permissionMissingRef.current = false;
      void poll();
    }
    window.addEventListener(BUILD_TRIGGER_EVENT, onTrigger);
    return () => window.removeEventListener(BUILD_TRIGGER_EVENT, onTrigger);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  // Background polling: fast while actively watching a build, otherwise a
  // slow sanity check (catches builds triggered outside this browser tab —
  // e.g. a direct commit on GitHub). Paused once we know Actions permission
  // is missing, since every poll would just fail the same way.
  useEffect(() => {
    const watching = phase === "building" || phase === "submitting";
    const tick = () => {
      if (!watching && permissionMissingRef.current) return;
      void poll();
    };
    tick();
    const interval = setInterval(tick, watching ? 3000 : 25000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, phase]);

  // Ticking elapsed-time counter while a build is being watched.
  useEffect(() => {
    if (phase !== "building" && phase !== "submitting") return;
    const update = () =>
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  if (phase === "hidden") return null;

  const progress = Math.min(96, (elapsedSeconds / EXPECTED_BUILD_SECONDS) * 96);
  const tone =
    phase === "failure"
      ? "border-red-200 bg-red-50 text-red-700"
      : phase === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : phase === "unknown"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-sky-200 bg-sky-50 text-sky-800";

  return (
    <div className={`sticky top-0 z-20 border-b px-4 py-2 text-sm sm:px-8 ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {phase === "submitting" && (
            <span>🕓 更改已提交,正在等待 GitHub 开始构建。已在云端排队,可离开本页。</span>
          )}
          {phase === "building" && (
            <span>
              ⏳ 正在构建:{describeBuildTrigger(snapshot?.commitMessage ?? null, snapshot?.event)} · {elapsedSeconds}s
              <span className="ml-1 font-normal text-sky-600/80">
                (预计 60–120 秒 · 已在 GitHub 上运行,可离开本页。再次保存会取消这次、改跑最新一次)
              </span>
            </span>
          )}
          {phase === "success" && (
            <span>✓ 构建成功:{describeBuildTrigger(snapshot?.commitMessage ?? null, snapshot?.event)}</span>
          )}
          {phase === "failure" && (
            <span>✗ 构建失败:{describeBuildTrigger(snapshot?.commitMessage ?? null, snapshot?.event)}</span>
          )}
          {phase === "unknown" && (
            <span>
              更改已提交,但 GitHub App 缺少「Actions」权限,无法在此显示实时进度(内容仍会正常构建)。
            </span>
          )}
          {(phase === "building" || phase === "success" || phase === "failure") &&
            snapshot?.htmlUrl && (
              <a href={snapshot.htmlUrl} target="_blank" rel="noreferrer" className="underline">
                在 GitHub 查看
              </a>
            )}
          {(phase === "submitting" || phase === "building") && (
            <a href="/help/builds" target="_blank" rel="noreferrer" className="underline">
              说明
            </a>
          )}
          {phase === "unknown" && (
            <a
              href={`https://github.com/${dataRepo}/actions`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              GitHub Actions 页面
            </a>
          )}
        </div>
        {(phase === "success" || phase === "failure" || phase === "unknown") && (
          <button
            type="button"
            onClick={() => setPhase("hidden")}
            className="text-xs opacity-60 hover:opacity-100"
            aria-label="关闭"
          >
            ✕
          </button>
        )}
      </div>
      {(phase === "building" || phase === "submitting") && (
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-sky-100">
          <div
            className="h-full rounded-full bg-sky-500 transition-[width] duration-300 ease-linear"
            style={{ width: `${phase === "submitting" ? 8 : progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
