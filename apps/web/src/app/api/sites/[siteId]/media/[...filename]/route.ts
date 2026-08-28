import { NextResponse } from "next/server";
import { getFileBinary, getInstallationOctokit, splitRepo } from "@/lib/github";
import { findOwnedSite } from "@/lib/sites";

/**
 * Authenticated preview of a data-repo image. The published site serves
 * `/media/...` from GitHub Pages; the admin editor runs on gitpress.net, so
 * those paths 404 there. Markdown still stores `/media/file.jpg`.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ siteId: string; filename: string[] }> },
) {
  const { siteId, filename } = await context.params;
  const name = filename.join("/");
  if (!name || name.includes("..") || name.startsWith("/")) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  const owned = await findOwnedSite(siteId);
  if (!owned) return new NextResponse("Unauthorized", { status: 401 });

  const octokit = await getInstallationOctokit(owned.installation.installationId);
  const file = await getFileBinary(octokit, splitRepo(owned.site.dataRepo), `media/${name}`);
  if (!file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
