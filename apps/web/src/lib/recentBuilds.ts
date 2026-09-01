import type { BuildRun } from "./github";

export const RECENT_BUILD_FETCH_COUNT = 20;
export const RECENT_BUILD_DISPLAY_LIMIT = 5;

export interface BuildRunGroup {
  key: string;
  latest: BuildRun;
  count: number;
  failedCount: number;
}

export function isScheduledBuildEvent(event: string | null | undefined): boolean {
  return event === "schedule";
}

/** Newest-first. Consecutive `schedule` runs collapse into one row. */
export function groupRecentBuildRuns(
  runs: BuildRun[],
  limit = RECENT_BUILD_DISPLAY_LIMIT,
): BuildRunGroup[] {
  const groups: BuildRunGroup[] = [];
  let index = 0;
  while (index < runs.length && groups.length < limit) {
    const latest = runs[index];
    if (!isScheduledBuildEvent(latest.event)) {
      groups.push({
        key: `run-${latest.id}`,
        latest,
        count: 1,
        failedCount: latest.conclusion === "failure" ? 1 : 0,
      });
      index += 1;
      continue;
    }
    let end = index + 1;
    let failedCount = latest.conclusion === "failure" ? 1 : 0;
    while (end < runs.length && isScheduledBuildEvent(runs[end].event)) {
      if (runs[end].conclusion === "failure") failedCount += 1;
      end += 1;
    }
    groups.push({
      key: `schedule-${latest.id}-${end - index}`,
      latest,
      count: end - index,
      failedCount,
    });
    index = end;
  }
  return groups;
}

export function scheduledBuildSubtitle(
  group: BuildRunGroup,
  latestTime: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (group.count <= 1) return latestTime;
  if (group.failedCount > 0) {
    return t("scheduleSummaryFailed", { n: group.count, failed: group.failedCount, time: latestTime });
  }
  return t("scheduleSummary", { n: group.count, time: latestTime });
}
