import { redirect } from "next/navigation";
import { PageEditor } from "@/components/PageEditor";
import { getPage, isPagePath } from "@/lib/content";
import { getInstallationOctokit } from "@/lib/github";
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
  const page = await getPage(octokit, site.dataRepo, path);
  if (!page) redirect(`/sites/${siteId}/pages`);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mb-5 shrink-0 text-2xl font-normal text-neutral-800">编辑页面</h1>
      <PageEditor
        siteId={siteId}
        path={page.path}
        initial={{
          title: page.title,
          description: page.description,
          body: page.body,
        }}
      />
    </div>
  );
}
