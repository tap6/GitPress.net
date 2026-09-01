import { NextResponse } from "next/server";
import { snapshotFromBuildRuns } from "@/lib/buildStatus";
import { getInstallationOctokit, listBuildRuns, splitRepo } from "@/lib/github";
import { findOwnedSite } from "@/lib/sites";

/**
 * Polled by the admin build banner. This is a GET route on purpose: calling a
 * Server Action from a timer makes `useFormStatus().pending` flicker on every
 * form on the page, which re-fires "waiting for build" after a run already
 * finished.
 */
export async function GET(_request: Request, context: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await context.params;
  const owned = await findOwnedSite(siteId);
  if (!owned) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const octokit = await getInstallationOctokit(owned.installation.installationId);
  const runs = await listBuildRuns(octokit, splitRepo(owned.site.dataRepo));
  return NextResponse.json(snapshotFromBuildRuns(runs), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
