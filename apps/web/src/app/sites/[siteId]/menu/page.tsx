import { MenuForm } from "@/components/MenuForm";
import { cachedListPages, cachedSiteCategories, cachedSiteNav } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "菜单" };

export default async function MenuPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const [categories, pages, nav] = await Promise.all([
    cachedSiteCategories(installation.installationId, site.dataRepo),
    cachedListPages(installation.installationId, site.dataRepo),
    cachedSiteNav(installation.installationId, site.dataRepo),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-normal text-neutral-800">菜单</h1>
      <p className="mt-2 text-sm text-neutral-500">
        决定顶部导航显示什么、按什么顺序、叫什么名字——包括首页链接是否显示。
        每项都可以改显示文案(例如把 Home 改成「首页」)。RSS 默认在页脚,不必放进顶栏;若仍想在顶栏显示,点「+ RSS」。
        页脚项目、版权和备案号请到「设置」里改。
        保存后顶栏只显示这里列出的项,分类页的「顶栏导航」开关不再起作用。
        {nav === null && "这是你第一次打开菜单编辑器,下面已经按当前主题的默认导航预填,保存后才会生效。"}
      </p>
      <div className="mt-5 rounded border border-neutral-200 bg-white shadow-sm">
        <MenuForm
          siteId={site.id}
          initial={nav}
          categories={categories}
          pages={pages}
          language={site.language}
        />
      </div>
    </div>
  );
}
