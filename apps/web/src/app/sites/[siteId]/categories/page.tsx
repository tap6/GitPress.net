import { CategoriesForm } from "@/components/CategoriesForm";
import { cachedSiteCategories } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "分类" };

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const categories = await cachedSiteCategories(installation.installationId, site.dataRepo);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-normal text-neutral-800">分类</h1>
      <p className="mt-2 text-sm text-neutral-500">
        维护一份有序的分类列表,前台会自动据此生成顶部导航和归档页。文章在编辑页选择所属分类,
        原有的自由标签(标签)不受影响。
      </p>
      <div className="mt-5 rounded border border-neutral-200 bg-white shadow-sm">
        <CategoriesForm siteId={site.id} initial={categories} />
      </div>
    </div>
  );
}
