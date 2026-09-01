import { redirectTo } from "@/i18n/redirect";
import { PageEditor } from "@/components/PageEditor";
import { getPage, isPagePath } from "@/lib/content";
import { getInstallationOctokit, listRepoCommits, splitRepo } from "@/lib/github";
import { cachedListPages, cachedSiteConfig } from "@/lib/siteDataCache";
import { convertUploadsToWebpEnabled } from "@/lib/convertUploadWebp";
import { requireSite } from "@/lib/sites";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("editor");
  return { title: t("editPage") };
}

export default async function EditPagePage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ path?: string }>;
}) {
  const { siteId } = await params;
  const { path } = await searchParams;
  const { site, installation } = await requireSite(siteId);
  const t = await getTranslations("editor");

  if (!path || !isPagePath(path)) {
    return await redirectTo(`/sites/${siteId}/pages`);
  }

  const octokit = await getInstallationOctokit(installation.installationId);
  const [listed, history, config] = await Promise.all([
    cachedListPages(installation.installationId, site.dataRepo, site.language),
    listRepoCommits(octokit, splitRepo(site.dataRepo), {
      path,
      perPage: 30,
    }),
    cachedSiteConfig(installation.installationId, site.dataRepo),
  ]);
  const page = listed.find((item) => item.path === path) ?? (await getPage(octokit, site.dataRepo, path));
  if (!page) return await redirectTo(`/sites/${siteId}/pages`);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mb-5 shrink-0 text-2xl font-normal text-neutral-800">{t("editPage")}</h1>
      <PageEditor
        siteId={siteId}
        path={page.path}
        gitCommits={history.commits}
        gitError={history.error}
        convertUploadsToWebp={convertUploadsToWebpEnabled(config?.site)}
        initial={{
          title: page.title,
          description: page.description,
          body: page.body,
          slug: page.slug,
        }}
      />
    </div>
  );
}
