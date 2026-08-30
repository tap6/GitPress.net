import { and, eq, ne } from "drizzle-orm";
import type { Octokit } from "octokit";
import { db } from "@/db";
import { githubInstallations, sites } from "@/db/schema";
import { getFileText, getInstallationOctokit, putFile, splitRepo } from "./github";
import {
  buildWorkflow,
  estimatePublishCheck,
  parsePublishCheck,
  PUBLISH_CHECK_WORKFLOW_PATH,
  type OtherPublishCheck,
  type PublishCheckIntervalId,
  type PublishCheckState,
} from "./publishCheck";

export async function getRepoIsPrivate(octokit: Octokit, dataRepo: string): Promise<boolean> {
  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
      ...splitRepo(dataRepo),
    });
    return Boolean(data.private);
  } catch {
    return true;
  }
}

export async function readWorkflowText(octokit: Octokit, dataRepo: string): Promise<string | null> {
  const raw = await getFileText(octokit, splitRepo(dataRepo), PUBLISH_CHECK_WORKFLOW_PATH);
  return raw?.text ?? null;
}

export async function writePublishCheckWorkflow(
  octokit: Octokit,
  dataRepo: string,
  siteRepo: string,
  interval: PublishCheckIntervalId | null,
  message: string,
): Promise<void> {
  await putFile(
    octokit,
    splitRepo(dataRepo),
    PUBLISH_CHECK_WORKFLOW_PATH,
    { utf8: buildWorkflow(siteRepo, interval) },
    message,
  );
}

/** Strip the old unmarked hourly cron. No-op unless the file is that legacy shape. */
export async function migrateLegacyPublishCheck(
  octokit: Octokit,
  dataRepo: string,
  siteRepo: string,
): Promise<boolean> {
  const current = await readWorkflowText(octokit, dataRepo);
  if (parsePublishCheck(current).status !== "legacyHourly") return false;
  const next = buildWorkflow(siteRepo, null);
  if (current === next) return false;
  await writePublishCheckWorkflow(
    octokit,
    dataRepo,
    siteRepo,
    null,
    "Turn off hourly publish check [skip ci]",
  );
  return true;
}

export async function loadPublishCheck(
  octokit: Octokit,
  dataRepo: string,
  siteRepo: string,
): Promise<PublishCheckState> {
  await migrateLegacyPublishCheck(octokit, dataRepo, siteRepo);
  const parsed = parsePublishCheck(await readWorkflowText(octokit, dataRepo));
  const dataRepoPrivate = await getRepoIsPrivate(octokit, dataRepo);
  if (parsed.status === "on") {
    return { enabled: true, interval: parsed.interval, dataRepoPrivate };
  }
  return { enabled: false, interval: null, dataRepoPrivate };
}

/** Read a data-repo workflow without migrating it. */
export async function peekPublishCheck(
  octokit: Octokit,
  dataRepo: string,
): Promise<PublishCheckState> {
  const parsed = parsePublishCheck(await readWorkflowText(octokit, dataRepo));
  const dataRepoPrivate = await getRepoIsPrivate(octokit, dataRepo);
  if (parsed.status === "on") {
    return { enabled: true, interval: parsed.interval, dataRepoPrivate };
  }
  return { enabled: false, interval: null, dataRepoPrivate };
}

export interface AccountPublishCheckContext {
  accountLogin: string;
  sameAccountSiteCount: number;
  otherChecks: OtherPublishCheck[];
  otherPrivateMinutes: number;
}

export async function listAccountPublishCheckContext(
  userId: string,
  currentSiteId: string,
  accountLogin: string,
): Promise<AccountPublishCheckContext> {
  const rows = await db
    .select({
      id: sites.id,
      name: sites.name,
      dataRepo: sites.dataRepo,
      installationNumericId: githubInstallations.installationId,
    })
    .from(sites)
    .innerJoin(githubInstallations, eq(sites.installationId, githubInstallations.id))
    .where(
      and(
        eq(sites.userId, userId),
        eq(githubInstallations.accountLogin, accountLogin),
        ne(sites.id, currentSiteId),
      ),
    );

  const otherChecks: OtherPublishCheck[] = [];
  await Promise.all(
    rows.map(async (row) => {
      try {
        const octokit = await getInstallationOctokit(row.installationNumericId);
        const check = await peekPublishCheck(octokit, row.dataRepo);
        if (!check.enabled || !check.interval || !check.dataRepoPrivate) return;
        otherChecks.push({
          siteId: row.id,
          name: row.name,
          interval: check.interval,
          minutesPerMonth: estimatePublishCheck(check.interval).minutesPerMonth,
        });
      } catch {
        // Sibling repo unreadable — skip rather than fail this site's settings.
      }
    }),
  );

  return {
    accountLogin,
    sameAccountSiteCount: rows.length + 1,
    otherChecks,
    otherPrivateMinutes: otherChecks.reduce((sum, site) => sum + site.minutesPerMonth, 0),
  };
}
