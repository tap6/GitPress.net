import type { Octokit } from "octokit";
import { getFileText, putFile, splitRepo } from "./github";
import {
  buildWorkflow,
  parsePublishCheck,
  PUBLISH_CHECK_WORKFLOW_PATH,
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
