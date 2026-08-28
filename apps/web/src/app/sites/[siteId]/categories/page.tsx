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
        维护一份有序的分类列表。文章在编辑页选择所属分类,前台会为每个分类生成归档页。
        「顶栏导航」只决定要不要出现在站点菜单里,关掉不等于删除,归档页和文章归属都还在。
        原有的自由标签不受影响。
      </p>
      <div className="mt-5 rounded border border-neutral-200 bg-white shadow-sm">
        <CategoriesForm siteId={site.id} initial={categories} />
      </div>
    </div>
  );
}
