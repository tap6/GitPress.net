import { getTranslations } from "next-intl/server";
import { PostPreviewBar, PostPreviewView } from "@/components/PostPreviewScreen";
import { getPost } from "@/lib/content";
import { getInstallationOctokit } from "@/lib/github";
import { redirectTo } from "@/i18n/redirect";
import {
  isPostContentPath,
  postEditHref,
  publicPostUrl,
} from "@/lib/postPreview";
import { buildPostPreviewChrome } from "@/lib/postPreviewChrome";
import { noIndexMetadata } from "@/lib/seo";
import { cachedListPages, cachedSiteConfig } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export async function generateMetadata() {
  const t = await getTranslations("posts");
  return noIndexMetadata(t("previewTitle"));
}

export default async function PostPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ path?: string }>;
}) {
  const { siteId } = await params;
  const { path } = await searchParams;
  const { site, installation } = await requireSite(siteId);

  if (!isPostContentPath(path)) {
    return await redirectTo(`/sites/${siteId}/posts`);
  }

  const octokit = await getInstallationOctokit(installation.installationId);
  const [post, config, pages] = await Promise.all([
    getPost(octokit, site.dataRepo, path),
    cachedSiteConfig(installation.installationId, site.dataRepo),
    cachedListPages(installation.installationId, site.dataRepo, site.language),
  ]);
  if (!post) return await redirectTo(`/sites/${siteId}/posts`);

  const t = await getTranslations("posts");
  const chrome = buildPostPreviewChrome(config, pages, {
    title: site.name,
    language: site.language,
  });
  const publicHref = post.draft ? null : publicPostUrl(site.url, post.slug);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <PostPreviewBar
        draft={post.draft}
        editHref={postEditHref(siteId, post.path)}
        backHref={`/sites/${siteId}/posts`}
        publicHref={publicHref}
        labels={{
          draftBadge: t("previewBarDraft"),
          liveBadge: t("previewBarLive"),
          disclaimer: t("previewDisclaimer"),
          goEdit: t("previewGoEdit"),
          back: t("previewBack"),
          openPublic: t("previewPublic"),
        }}
      />
      <PostPreviewView siteId={siteId} post={post} chrome={chrome} />
    </div>
  );
}
