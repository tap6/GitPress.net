import { nowLocalDateTime, parsePostDate } from "./postDate";

/** Same bucket as GitHub's private-repo Actions free allowance. */
export const PUBLISH_CHECK_QUOTA_MINUTES = 2000;
export const ESTIMATED_MINUTES_PER_SCHEDULED_RUN = 2;
export const PUBLISH_CHECK_MONTH_DAYS = 30;
export const DEFAULT_PUBLISH_CHECK_INTERVAL = "6h";
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

/** Clock off: keep or pull an existing future date; do not push later or newly schedule. */
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

export function dateInputMax(enabled: boolean, previousDate: string | null): string | undefined {
  if (enabled) return undefined;
  const now = nowLocalDateTime();
  if (previousDate && previousDate > now) return previousDate;
  return now;
}
