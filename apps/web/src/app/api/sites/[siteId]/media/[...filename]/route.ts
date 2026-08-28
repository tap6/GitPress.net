import { NextResponse } from "next/server";
import { getFileBinary, getInstallationOctokit, splitRepo } from "@/lib/github";
import { findOwnedSite } from "@/lib/sites";

/**
 * Authenticated preview of a data-repo image. The published site serves
 * `/media/...` from GitHub Pages; the admin editor runs on gitpress.net, so
 * those paths 404 there. Markdown still stores `/media/file.jpg`.
 *
 * Do not send GitHub `download_url` to the browser: for private repos those
 * links expire in about five minutes and are documented as single-use.
 */
function previewCacheHeaders(sha?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
  };
  if (sha) {
    headers.ETag = `"${sha}"`;
    headers["Cache-Control"] = "private, max-age=31536000, immutable";
  } else {
    headers["Cache-Control"] = "private, max-age=86400, stale-while-revalidate=604800";
  }
  return headers;
}

function etagMatches(header: string | null, sha: string): boolean {
  if (!header) return false;
  const expected = `"${sha}"`;
  return header.split(",").some((value) => {
    const token = value.trim();
    return token === expected || token === `W/${expected}` || token === sha;
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ siteId: string; filename: string[] }> },
) {
  const { siteId, filename } = await context.params;
  const name = filename.join("/");
  if (!name || name.includes("..") || name.startsWith("/")) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  const owned = await findOwnedSite(siteId);
  if (!owned) return new NextResponse("Unauthorized", { status: 401 });

  const sha = new URL(request.url).searchParams.get("v") ?? undefined;
  if (sha && etagMatches(request.headers.get("if-none-match"), sha)) {
    return new NextResponse(null, { status: 304, headers: previewCacheHeaders(sha) });
  }

  const octokit = await getInstallationOctokit(owned.installation.installationId);
  const file = await getFileBinary(
    octokit,
    splitRepo(owned.site.dataRepo),
    `media/${name}`,
    sha,
  );
  if (!file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      ...previewCacheHeaders(file.sha),
    },
  });
}
