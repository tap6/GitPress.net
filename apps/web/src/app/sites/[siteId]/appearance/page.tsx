import { saveThemeOptionsAction, switchThemeAction } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import { BUILTIN_THEMES, getBuiltinTheme, themeOptionLabel } from "@/lib/themes";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "外观" };

export default async function AppearancePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site } = await requireSite(siteId);
  const currentTheme = getBuiltinTheme(site.themeName);
  const themeConfig = (site.themeConfig ?? {}) as Record<string, unknown>;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-normal text-neutral-800">外观 · 主题</h1>
      <p className="mt-1 text-sm text-neutral-500">
        主题只改变呈现方式,你的文章与图片保存在数据仓库中,换主题零影响。
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {BUILTIN_THEMES.map((theme) => {
          const active = theme.name === site.themeName;
          return (
            <div
              key={theme.name}
              className={`overflow-hidden rounded-lg border-2 bg-white shadow-sm ${
                active ? "border-wp-accent" : "border-neutral-200"
              }`}
            >
              <div
                className="h-36 p-4"
                style={{ backgroundColor: theme.palette.bg, color: theme.palette.fg }}
              >
                <p className={`text-sm font-bold ${theme.serif ? "font-serif" : ""}`}>
                  {theme.displayName} Blog
                </p>
                <div
                  className="mt-2 h-1.5 w-3/4 rounded"
                  style={{ backgroundColor: theme.palette.accent }}
                />
                <div
                  className="mt-2 h-1.5 w-full rounded opacity-40"
                  style={{ backgroundColor: theme.palette.muted }}
                />
                <div
                  className="mt-1.5 h-1.5 w-5/6 rounded opacity-40"
                  style={{ backgroundColor: theme.palette.muted }}
                />
              </div>
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

      {currentTheme && Object.keys(currentTheme.configSchema.properties ?? {}).length > 0 && (
        <div className="mt-8 max-w-lg rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">
            {currentTheme.displayName} 主题选项
          </h2>
          <form action={saveThemeOptionsAction} className="space-y-4 p-5 text-sm">
            <input type="hidden" name="siteId" value={site.id} />
            {Object.entries(currentTheme.configSchema.properties ?? {}).map(([key, property]) => {
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

      <p className="mt-6 text-xs text-neutral-400">
        即将推出:主题商店(分享你的主题)与 AI 生成主题(使用你自己的 API Key)。
        主题规范已开源,任何符合 spec v1 的 Astro 主题都可以接入。
      </p>
    </div>
  );
}
