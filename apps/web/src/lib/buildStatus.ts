import type { BuildRunsResult } from "./github";

export interface BuildStatusSnapshot {
  status: "idle" | "queued" | "in_progress" | "success" | "failure" | "cancelled" | "unknown";
  runId?: number;
  createdAt?: string;
  htmlUrl?: string;
  commitMessage?: string | null;
  event?: string | null;
  actionsPermissionMissing: boolean;
}

export function snapshotFromBuildRuns(result: BuildRunsResult): BuildStatusSnapshot {
  if (result.actionsPermissionMissing) {
    return { status: "unknown", actionsPermissionMissing: true };
  }
  const latest = result.runs[0];
  if (!latest) return { status: "idle", actionsPermissionMissing: false };
  if (latest.conclusion == null) {
    return {
      status: latest.status === "queued" ? "queued" : "in_progress",
      runId: latest.id,
      createdAt: latest.createdAt,
      htmlUrl: latest.htmlUrl,
      commitMessage: latest.commitMessage,
      event: latest.event,
      actionsPermissionMissing: false,
    };
  }
  const status =
    latest.conclusion === "success"
      ? "success"
      : latest.conclusion === "failure"
        ? "failure"
        : "cancelled";
  return {
    status,
    runId: latest.id,
    createdAt: latest.createdAt,
    htmlUrl: latest.htmlUrl,
    commitMessage: latest.commitMessage,
    event: latest.event,
    actionsPermissionMissing: false,
  };
}
