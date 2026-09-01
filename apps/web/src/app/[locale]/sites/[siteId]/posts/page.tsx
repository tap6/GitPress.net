import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { PostsTable } from "./PostsTable";
import { getInstallationOctokit } from "@/lib/github";
import { loadPublishCheck } from "@/lib/publishCheckRepo";
import { cachedListPosts, cachedSiteCategories } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export async function generateMetadata() {
  const t = await getTranslations("posts");
  return { title: t("title") };
}

export default async function PostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { siteId } = await params;
  const { saved } = await searchParams;
  const { site, installation } = await requireSite(siteId);
  const t = await getTranslations("posts");
  const th = await getTranslations("help.drafts");
  const octokit = await getInstallationOctokit(installation.installationId);
  const [posts, categories, publishCheck] = await Promise.all([
    cachedListPosts(installation.installationId, site.dataRepo),
    cachedSiteCategories(installation.installationId, site.dataRepo),
    loadPublishCheck(octokit, site.dataRepo, site.siteRepo),
  ]);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-normal text-neutral-800">{t("title")}</h1>
        <Link
          href={`/sites/${site.id}/posts/new`}
          className="rounded border border-wp-accent px-3 py-1 text-sm text-wp-accent hover:bg-wp-accent hover:text-white"
        >
          {t("write")}
        </Link>
      </div>

      {saved === "draft" && (
        <div className="mt-4 rounded border-l-4 border-amber-400 bg-white p-3 text-sm shadow-sm">
          {t("savedDraft")}
        </div>
      )}
      {saved === "1" && (
        <div className="mt-4 rounded border-l-4 border-emerald-500 bg-white p-3 text-sm shadow-sm">
          {t("saved")}
        </div>
      )}

      <PostsTable
        siteId={site.id}
        posts={posts}
        categories={categories}
        publishCheckEnabled={publishCheck.enabled}
      />

      <p className="mt-3 text-xs text-neutral-400">
        {t("footnote")}{" "}
        <Link href="/help/drafts-and-builds" className="text-wp-accent hover:underline">
          {th("nav")}
        </Link>
      </p>
    </div>
  );
}
