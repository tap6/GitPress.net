"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BuildStatusSnapshot } from "@/lib/buildStatus";
import { isScheduledBuildEvent } from "@/lib/recentBuilds";
import { BUILD_CANCEL_EVENT, BUILD_TRIGGER_EVENT, type BuildTriggerDetail } from "./buildTriggerEvent";

type Phase = "hidden" | "submitting" | "building" | "success" | "failure" | "unknown" | "stalled";

/** Rough historical duration of a GitPress build (Astro build + Pages deploy). */
const EXPECTED_BUILD_SECONDS = 90;
/** If GitHub never registers a run (workflow missing / Actions off), stop spinning. */
const SUBMIT_STALL_MS = 90_000;

interface Props {
  siteId: string;
  dataRepo: string;
  siteRepo: string;
}

function repoName(full: string): string {
  const name = full.split("/").pop();
  return name && name.length > 0 ? name : full;
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
export function BuildStatusBar({ siteId, dataRepo, siteRepo }: Props) {
  const t = useTranslations("buildBar");
  const tc = useTranslations("common");
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
      const response = await fetch(`/api/sites/${siteId}/build-status`, { cache: "no-store" });
      if (!response.ok) return;
      result = (await response.json()) as BuildStatusSnapshot;
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
      } else if (result.status === "cancelled") {
        // A newer push cancelled this run (`cancel-in-progress`). Wait for the
        // replacement instead of treating the cancel as a finished build.
        watchedRunId.current = undefined;
        startedAtRef.current = Date.now();
        setPhase("submitting");
      } else {
        setPhase("hidden");
      }
      return;
    }
    if (
      phaseRef.current === "submitting" &&
      Date.now() - startedAtRef.current > SUBMIT_STALL_MS
    ) {
      setPhase("stalled");
    }
  }

  // A ProgressButton anywhere in the admin just finished a build-triggering
  // submission — start watching immediately rather than waiting for the
  // next background poll tick.
  useEffect(() => {
    function onTrigger(event: Event) {
      const detail = (event as CustomEvent<BuildTriggerDetail>).detail;
      if (detail?.siteId !== siteId) return;
      if (phaseRef.current === "submitting" || phaseRef.current === "building") {
        void poll();
        return;
      }
      setPhase("submitting");
      startedAtRef.current = Date.now();
      watchedRunId.current = undefined;
      permissionMissingRef.current = false;
      void poll();
    }
    window.addEventListener(BUILD_TRIGGER_EVENT, onTrigger);
    function onCancel(event: Event) {
      const detail = (event as CustomEvent<BuildTriggerDetail>).detail;
      if (detail?.siteId !== siteId) return;
      if (phaseRef.current !== "submitting" && phaseRef.current !== "stalled") return;
      if (watchedRunId.current != null) return;
      setPhase("hidden");
    }
    window.addEventListener(BUILD_CANCEL_EVENT, onCancel);
    return () => {
      window.removeEventListener(BUILD_TRIGGER_EVENT, onTrigger);
      window.removeEventListener(BUILD_CANCEL_EVENT, onCancel);
    };
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

  const dataLabel = repoName(dataRepo);
  const siteLabel = repoName(siteRepo);
  const pipeline = t("pipeline", { data: dataLabel, site: siteLabel });
  const scheduled = isScheduledBuildEvent(snapshot?.event);
  const progress = Math.min(96, (elapsedSeconds / EXPECTED_BUILD_SECONDS) * 96);
  const tone =
    phase === "failure"
      ? "border-red-200 bg-red-50 text-red-700"
      : phase === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : phase === "unknown" || phase === "stalled"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-sky-200 bg-sky-50 text-sky-800";

  return (
    <div className={`sticky top-0 z-20 border-b px-4 py-2 text-sm sm:px-8 ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {phase === "submitting" && <span>{t("submitting")}</span>}
          {phase === "building" && (
            <span>
              {t("building", {
                prefix: scheduled ? t("scheduled") : "",
                pipeline,
                seconds: elapsedSeconds,
              })}
              <span className="ml-1 font-normal text-sky-600/80">{t("buildingHint")}</span>
            </span>
          )}
          {phase === "success" && <span>{t("success", { pipeline })}</span>}
          {phase === "failure" && <span>{t("failure", { pipeline })}</span>}
          {phase === "unknown" && <span>{t("unknown")}</span>}
          {phase === "stalled" && <span>{t("stalled")}</span>}
          {(phase === "building" || phase === "success" || phase === "failure") &&
            snapshot?.htmlUrl && (
              <a href={snapshot.htmlUrl} target="_blank" rel="noreferrer" className="underline">
                {t("viewGithub")}
              </a>
            )}
          {(phase === "submitting" || phase === "building") && (
            <Link href="/help/builds" target="_blank" rel="noreferrer" className="underline">
              {t("help")}
            </Link>
          )}
          {phase === "unknown" && (
            <a
              href={`https://github.com/${dataRepo}/actions`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {t("actionsPage")}
            </a>
          )}
          {phase === "stalled" && (
            <a
              href={`https://github.com/${dataRepo}/actions`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {t("actionsPage")}
            </a>
          )}
        </div>
        {(phase === "success" ||
          phase === "failure" ||
          phase === "unknown" ||
          phase === "stalled") && (
          <button
            type="button"
            onClick={() => setPhase("hidden")}
            className="text-xs opacity-60 hover:opacity-100"
            aria-label={tc("close")}
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
