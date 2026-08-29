import { PageEditor } from "@/components/PageEditor";
import { cachedSiteNav } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "写页面" };

export default async function NewPagePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const nav = await cachedSiteNav(installation.installationId, site.dataRepo);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mb-5 shrink-0 text-2xl font-normal text-neutral-800">写页面</h1>
      <PageEditor siteId={siteId} hasCustomNav={nav !== null} />
    </div>
  );
}
