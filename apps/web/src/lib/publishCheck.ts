import { nowLocalDateTime, parsePostDate } from "./postDate";

/** Same bucket as GitHub's private-repo Actions free allowance. */
export const PUBLISH_CHECK_QUOTA_MINUTES = 2000;
export const ESTIMATED_MINUTES_PER_SCHEDULED_RUN = 2;
export const PUBLISH_CHECK_MONTH_DAYS = 30;
export const DEFAULT_PUBLISH_CHECK_INTERVAL = "2h";
/** Stacked account estimate at or above this needs an extra confirm before save. */
export const QUOTA_CAUTION_PERCENT = 80;
export const PUBLISH_CHECK_WORKFLOW_PATH = ".github/workflows/gitpress-build.yml";
export const LEGACY_HOURLY_CRON = "7 * * * *";

const MARKER_RE = /^\s*#\s*gitpress-publish-check:\s*(\S+)/m;
const CRON_RE = /cron:\s*["']([^"']+)["']/;

export const PUBLISH_CHECK_INTERVAL_IDS = [
  "15m",
  "30m",
  "1h",
  "2h",
  "3h",
  "6h",
  "12h",
  "24h",
] as const;

export type PublishCheckIntervalId = (typeof PUBLISH_CHECK_INTERVAL_IDS)[number];

/** First-enable default and the in-form “建议” mark. 2h ≈ 36% of the free 2000. */
export const SUGGESTED_PUBLISH_CHECK_INTERVAL: PublishCheckIntervalId = "2h";

export interface PublishCheckInterval {
  id: PublishCheckIntervalId;
  minutes: number;
  label: string;
  cron: string;
}

export const PUBLISH_CHECK_INTERVALS: readonly PublishCheckInterval[] = [
  { id: "15m", minutes: 15, label: "每 15 分钟", cron: "*/15 * * * *" },
  { id: "30m", minutes: 30, label: "每 30 分钟", cron: "*/30 * * * *" },
  { id: "1h", minutes: 60, label: "每小时", cron: "11 * * * *" },
  { id: "2h", minutes: 120, label: "每 2 小时", cron: "11 */2 * * *" },
  { id: "3h", minutes: 180, label: "每 3 小时", cron: "11 */3 * * *" },
  { id: "6h", minutes: 360, label: "每 6 小时", cron: "11 */6 * * *" },
  { id: "12h", minutes: 720, label: "每 12 小时", cron: "11 */12 * * *" },
  { id: "24h", minutes: 1440, label: "每天一次", cron: "11 0 * * *" },
];

export interface PublishCheckEstimate {
  runsPerMonth: number;
  minutesPerMonth: number;
  percentOfQuota: number;
}

export type PublishCheckParse =
  | { status: "off" }
  | { status: "on"; interval: PublishCheckIntervalId }
  | { status: "legacyHourly" };

export interface PublishCheckState {
  enabled: boolean;
  interval: PublishCheckIntervalId | null;
  dataRepoPrivate: boolean;
}

function buildActionRepo(): string {
  return process.env.GITPRESS_BUILD_ACTION_REPO ?? "tap6/build-action";
}

function themesRepo(): string {
  return process.env.GITPRESS_THEMES_REPO ?? "tap6/gitpress";
}

export function isPublishCheckIntervalId(value: string): value is PublishCheckIntervalId {
  return (PUBLISH_CHECK_INTERVAL_IDS as readonly string[]).includes(value);
}

export function getPublishCheckInterval(id: PublishCheckIntervalId): PublishCheckInterval {
  const found = PUBLISH_CHECK_INTERVALS.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown publish-check interval ${id}`);
  return found;
}

export function estimatePublishCheck(id: PublishCheckIntervalId): PublishCheckEstimate {
  const { minutes } = getPublishCheckInterval(id);
  const runsPerMonth = Math.round((PUBLISH_CHECK_MONTH_DAYS * 24 * 60) / minutes);
  const minutesPerMonth = runsPerMonth * ESTIMATED_MINUTES_PER_SCHEDULED_RUN;
  return {
    runsPerMonth,
    minutesPerMonth,
    percentOfQuota: Math.round((minutesPerMonth / PUBLISH_CHECK_QUOTA_MINUTES) * 100),
  };
}

export function estimateSaveMinutes(savesPerMonth: number): number {
  const count = Number.isFinite(savesPerMonth) ? Math.max(0, Math.round(savesPerMonth)) : 0;
  return count * ESTIMATED_MINUTES_PER_SCHEDULED_RUN;
}

export function remainingSaveCount(clockMinutes: number, saveMinutes = 0): number {
  const leftover =
    Math.round((PUBLISH_CHECK_QUOTA_MINUTES * QUOTA_CAUTION_PERCENT) / 100) - clockMinutes - saveMinutes;
  return Math.max(0, Math.floor(leftover / ESTIMATED_MINUTES_PER_SCHEDULED_RUN));
}

export interface OtherPublishCheck {
  siteId: string;
  name: string;
  interval: PublishCheckIntervalId;
  minutesPerMonth: number;
}

export interface QuotaProjection {
  thisMinutes: number;
  otherMinutes: number;
  saveMinutes: number;
  totalMinutes: number;
  percent: number;
  reasons: string[];
}

export function thisCheckMinutes(
  enabled: boolean,
  interval: PublishCheckIntervalId | null,
  isPrivate: boolean,
): number {
  if (!enabled || !isPrivate || !interval) return 0;
  return estimatePublishCheck(interval).minutesPerMonth;
}

export function projectQuotaUsage(options: {
  enabled: boolean;
  interval: PublishCheckIntervalId | null;
  isPrivate: boolean;
  otherMinutes: number;
  saveMinutes?: number;
  otherChecks?: OtherPublishCheck[];
  accountUsedMinutes?: number | null;
}): QuotaProjection {
  const thisMinutes = thisCheckMinutes(options.enabled, options.interval, options.isPrivate);
  const otherMinutes = Math.max(0, options.otherMinutes);
  const saveMinutes = Math.max(0, options.saveMinutes ?? 0);
  const totalMinutes = thisMinutes + otherMinutes + saveMinutes;
  const percent = Math.round((totalMinutes / PUBLISH_CHECK_QUOTA_MINUTES) * 100);
  const reasons: string[] = [];
  const others = options.otherChecks ?? [];
  if (others.length > 0) {
    const names = others.map((site) => `「${site.name}」`).join("、");
    reasons.push(
      `同一个 GitHub 帐户下还有 ${others.length} 个站开了定时发布检查（${names}），额度是共用的`,
    );
  }
  if (thisMinutes >= estimatePublishCheck("1h").minutesPerMonth) {
    reasons.push("当前间隔比较密，空转次数会很多");
  }
  if (options.accountUsedMinutes != null && options.accountUsedMinutes >= PUBLISH_CHECK_QUOTA_MINUTES * 0.4) {
    reasons.push(`这个帐户本月已经用了约 ${Math.round(options.accountUsedMinutes)} 分钟`);
  }
  if (saveMinutes >= 80) {
    reasons.push("按填写的保存次数，点保存本身也会占掉一部分时长");
  }
  if (reasons.length === 0 && percent >= QUOTA_CAUTION_PERCENT) {
    reasons.push("预计占用已经偏高");
  }
  return { thisMinutes, otherMinutes, saveMinutes, totalMinutes, percent, reasons };
}

export function publishCheckConfirmKey(
  enabled: boolean,
  interval: PublishCheckIntervalId | null,
): string {
  return enabled ? `on:${interval}` : "off";
}

/**
 * Tightest practical interval that keeps checks + optional save budget
 * under the caution line. Empty save count only subtracts other sites' clocks.
 */
export function recommendPublishCheckInterval(
  savesPerMonth: number | null,
  otherMinutes = 0,
): PublishCheckIntervalId {
  const saveMin = savesPerMonth == null ? 0 : estimateSaveMinutes(savesPerMonth);
  const clockBudget = Math.max(
    0,
    Math.round((PUBLISH_CHECK_QUOTA_MINUTES * QUOTA_CAUTION_PERCENT) / 100) - saveMin - otherMinutes,
  );
  const preferred: PublishCheckIntervalId[] = ["1h", "2h", "3h", "6h", "12h", "24h"];
  for (const id of preferred) {
    if (estimatePublishCheck(id).minutesPerMonth <= clockBudget) return id;
  }
  return "24h";
}

export function parsePublishCheck(yml: string | null | undefined): PublishCheckParse {
  if (!yml) return { status: "off" };
  const marked = yml.match(MARKER_RE);
  if (marked) {
    const id = marked[1];
    if (isPublishCheckIntervalId(id)) return { status: "on", interval: id };
    return { status: "off" };
  }
  const cron = yml.match(CRON_RE);
  if (cron?.[1] === LEGACY_HOURLY_CRON) return { status: "legacyHourly" };
  return { status: "off" };
}

export function buildWorkflow(siteRepo: string, interval: PublishCheckIntervalId | null): string {
  const scheduleBlock = interval
    ? `\n# gitpress-publish-check: ${interval}\nname: GitPress Build

on:
  push:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: "${getPublishCheckInterval(interval).cron}"
`
    : `\nname: GitPress Build

on:
  push:
    branches: [main]
  workflow_dispatch:
`;

  return `# GitPress build pipeline — intentionally thin.
# All build logic lives in the versioned action so this file rarely (if ever)
# needs to change. Breaking changes only ship under a new major tag (@v2).${scheduleBlock}
permissions:
  contents: read

concurrency:
  group: gitpress-build
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Build site and publish to the site repository
        uses: ${buildActionRepo()}@v1
        with:
          site-repo: ${siteRepo}
          themes-repo: ${themesRepo()}
          deploy-key: \${{ secrets.GITPRESS_DEPLOY_KEY }}
`;
}

export function isFuturePostDate(date: string | null | undefined, now = nowLocalDateTime()): boolean {
  const normalized = parsePostDate(date);
  return Boolean(normalized && normalized > now);
}

export function listScheduledPosts<T extends { title: string; path: string; date: string | null; draft: boolean }>(
  posts: T[],
  now = nowLocalDateTime(),
): Array<Pick<T, "title" | "path">> {
  return posts
    .filter((post) => !post.draft && isFuturePostDate(post.date, now))
    .map((post) => ({ title: post.title, path: post.path }));
}

/** Clock off: keep or pull an existing future date; do not push later or newly schedule.
 *  `now` must be the author's wall clock (`YYYY-MM-DDTHH:mm:ss`), not the server timezone. */
export function futureDateNotAllowed(
  nextDate: string,
  previousDate: string | null,
  now = nowLocalDateTime(),
): boolean {
  if (nextDate <= now) return false;
  if (previousDate && nextDate <= previousDate) return false;
  return true;
}

export function futureDateBlockedMessage(): string {
  return "定时发布已关闭，不能把日期选到现在之后。需要预约请到设置 → 定时发布。";
}

export function dateInputMax(
  enabled: boolean,
  previousDate: string | null,
  now = nowLocalDateTime(),
): string | undefined {
  if (enabled) return undefined;
  if (previousDate && previousDate > now) return previousDate;
  return now;
}
