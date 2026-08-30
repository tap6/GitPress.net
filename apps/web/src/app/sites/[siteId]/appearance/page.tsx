import { applyCatalogThemeAction, saveThemeOptionsAction, switchThemeAction } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import { ThemeImportForm } from "@/components/ThemeImportForm";
import { ThemePreviewImage } from "@/components/ThemePreviewImage";
import { cachedSiteConfig } from "@/lib/siteDataCache";
import { listListedThemeCatalog } from "@/lib/themeCatalog";
import { fetchGithubThemeManifest, githubThemePreviewUrl } from "@/lib/themeSource";
import { BUILTIN_THEMES, getBuiltinTheme, themeOptionLabel } from "@/lib/themes";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "外观" };

export default async function AppearancePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const [config, catalog] = await Promise.all([
    cachedSiteConfig(installation.installationId, site.dataRepo),
    listListedThemeCatalog(),
  ]);
  const themeSource = String(config?.theme.source ?? "builtin");
  const usingBuiltin = themeSource === "builtin";
  const currentTheme = usingBuiltin ? getBuiltinTheme(site.themeName) : null;
  const importedManifest = usingBuiltin ? null : await fetchGithubThemeManifest(themeSource);
  const optionSchema = currentTheme?.configSchema ?? importedManifest?.configSchema;
  const optionTitle = currentTheme?.displayName ?? importedManifest?.displayName ?? site.themeName;
  const themeConfig = (site.themeConfig ?? {}) as Record<string, unknown>;
  const optionEntries = Object.entries(optionSchema?.properties ?? {});

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-normal text-neutral-800">外观 · 主题</h1>
      <p className="mt-1 text-sm text-neutral-500">
        主题只改变呈现方式,你的文章与图片保存在数据仓库中,换主题零影响。
      </p>

      {!usingBuiltin && (
        <div className="mt-5 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          当前使用导入主题 <strong>{site.themeName}</strong>
          <span className="mt-1 block font-mono text-xs text-amber-800/80">{themeSource}</span>
          点选上方内置主题可改回去。
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {BUILTIN_THEMES.map((theme) => {
          const active = usingBuiltin && theme.name === site.themeName;
          return (
            <div
              key={theme.name}
              className={`overflow-hidden rounded-lg border-2 bg-white shadow-sm ${
                active ? "border-wp-accent" : "border-neutral-200"
              }`}
            >
              <ThemePreviewImage src={theme.previewSrc} alt={`${theme.displayName} 预览`} />
              <div className="border-t border-neutral-100 p-4">
                <p className="text-sm font-semibold">{theme.displayName}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{theme.description}</p>
                {active ? (
                  <p className="mt-3 text-xs font-medium text-wp-accent">✓ 当前主题</p>
                ) : (
                  <form action={switchThemeAction} className="mt-3">
                    <input type="hidden" name="siteId" value={site.id} />
                    <input type="hidden" name="theme" value={theme.name} />
                    <ProgressButton
                      expectedSeconds={5}
                      pendingLabel="切换中"
                      buildSiteId={site.id}
                      className="rounded border border-wp-accent px-3 py-1 text-xs text-wp-accent hover:bg-wp-accent hover:text-white"
                    >
                      启用
                    </ProgressButton>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {catalog.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-neutral-700">主题商店</h2>
          <p className="mt-1 text-xs text-neutral-400">
            运营上架的 GitHub 主题。启用后由你自己的 Actions 拉取,不会装到 GitPress 服务器。
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catalog.map((listing) => {
              const active = !usingBuiltin && themeSource === listing.source;
              return (
                <div
                  key={listing.id}
                  className={`overflow-hidden rounded-lg border-2 bg-white shadow-sm ${
                    active ? "border-wp-accent" : "border-neutral-200"
                  }`}
                >
                  <ThemePreviewImage
                    src={githubThemePreviewUrl(listing.source)}
                    alt={`${listing.displayName} 预览`}
                  />
                  <div className="border-t border-neutral-100 p-4">
                    <p className="text-sm font-semibold">{listing.displayName}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-neutral-400">{listing.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{listing.description || "社区主题"}</p>
                    <p className="mt-2 truncate font-mono text-[10px] text-neutral-400" title={listing.source}>
                      {listing.source}
                    </p>
                    {active ? (
                      <p className="mt-3 text-xs font-medium text-wp-accent">✓ 当前主题</p>
                    ) : (
                      <form action={applyCatalogThemeAction} className="mt-3">
                        <input type="hidden" name="siteId" value={site.id} />
                        <input type="hidden" name="listingId" value={listing.id} />
                        <ProgressButton
                          expectedSeconds={6}
                          pendingLabel="启用中"
                          buildSiteId={site.id}
                          className="rounded border border-wp-accent px-3 py-1 text-xs text-wp-accent hover:bg-wp-accent hover:text-white"
                        >
                          启用
                        </ProgressButton>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {optionEntries.length > 0 && (
        <div className="mt-8 max-w-lg rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">
            {optionTitle} 主题选项
          </h2>
          <form action={saveThemeOptionsAction} className="space-y-4 p-5 text-sm">
            <input type="hidden" name="siteId" value={site.id} />
            {optionEntries.map(([key, property]) => {
              const current = themeConfig[key] ?? property.default;
              const name = `opt_${key}`;
              return (
                <label key={key} className="flex items-center justify-between gap-4">
                  <span>{themeOptionLabel(key, property)}</span>
                  {property.type === "boolean" ? (
                    <input
                      type="checkbox"
                      name={name}
                      defaultChecked={Boolean(current)}
                      className="accent-wp-accent"
                    />
                  ) : property.format === "color" ? (
                    <input
                      type="color"
                      name={name}
                      defaultValue={String(current ?? "#000000")}
                      className="h-8 w-16 cursor-pointer rounded border border-neutral-300"
                    />
                  ) : property.enum ? (
                    <select
                      name={name}
                      defaultValue={String(current ?? "")}
                      className="rounded border border-neutral-300 bg-white px-2 py-1"
                    >
                      {property.enum.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={property.type === "number" || property.type === "integer" ? "number" : "text"}
                      name={name}
                      defaultValue={String(current ?? "")}
                      className="w-40 rounded border border-neutral-300 px-2 py-1"
                    />
                  )}
                </label>
              );
            })}
            <ProgressButton
              expectedSeconds={5}
              pendingLabel="保存中"
              buildSiteId={site.id}
              className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
            >
              保存并重新构建
            </ProgressButton>
          </form>
        </div>
      )}

      <div className="mt-8 max-w-lg rounded border border-neutral-200 bg-white shadow-sm">
        <h2 className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3 text-sm font-semibold">
          从 GitHub 导入主题
          <a
            href="/help/import-theme"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-wp-accent hover:underline"
          >
            帮助 ↗
          </a>
        </h2>
        <ThemeImportForm siteId={site.id} />
      </div>

      <p className="mt-6 text-xs text-neutral-400">
        主题商店由运营在后台维护。也可以从任意公开 GitHub 仓库导入符合 spec v1 的 Astro 主题。
        想自己做一份?看{" "}
        <a href="/make-theme" className="underline hover:text-neutral-600">
          DIY 主题教程
        </a>
        ,里面有给 AI 的完整第一条提示词。
      </p>
    </div>
  );
}
