import { redirect } from "next/navigation";
import { PageEditor } from "@/components/PageEditor";
import { getPage, isPagePath } from "@/lib/content";
import { getInstallationOctokit, listRepoCommits, splitRepo } from "@/lib/github";
import { cachedListPages } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "编辑页面" };

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

  if (!path || !isPagePath(path)) {
    redirect(`/sites/${siteId}/pages`);
  }

  const octokit = await getInstallationOctokit(installation.installationId);
  const listed = (await cachedListPages(installation.installationId, site.dataRepo)).find(
    (item) => item.path === path,
  );
  const page = listed ?? (await getPage(octokit, site.dataRepo, path));
  if (!page) redirect(`/sites/${siteId}/pages`);
  const history = await listRepoCommits(octokit, splitRepo(site.dataRepo), {
    path: page.path,
    perPage: 30,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mb-5 shrink-0 text-2xl font-normal text-neutral-800">编辑页面</h1>
      <PageEditor
        siteId={siteId}
        path={page.path}
        gitCommits={history.commits}
        gitError={history.error}
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
