/**
 * Shared contract for the `window` CustomEvent that `ProgressButton` fires
 * once a build-triggering server action resolves, and that `BuildStatusBar`
 * listens for to start watching the newly queued GitHub Actions run. A plain
 * window event keeps the two components decoupled — they're mounted in
 * separate parts of the tree (layout vs. individual pages) with no shared
 * React context.
 */
export const BUILD_TRIGGER_EVENT = "gp:build-trigger";

export interface BuildTriggerDetail {
  siteId: string;
}
