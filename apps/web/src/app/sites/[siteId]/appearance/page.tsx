import { saveThemeOptionsAction, switchThemeAction } from "@/lib/actions";
import { BUILTIN_THEMES, getBuiltinTheme } from "@/lib/themes";
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
    <div className="max-w-4xl">
      <h1 className="text-2xl font-normal text-neutral-800">外观 · 主题</h1>
      <p className="mt-1 text-sm text-neutral-500">
        主题只改变呈现方式,你的文章与图片保存在数据仓库中,换主题零影响。
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
                    <button className="rounded border border-wp-accent px-3 py-1 text-xs text-wp-accent hover:bg-wp-accent hover:text-white">
                      启用
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {currentTheme && currentTheme.options.length > 0 && (
        <div className="mt-8 max-w-lg rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">
            {currentTheme.displayName} 主题选项
          </h2>
          <form action={saveThemeOptionsAction} className="space-y-4 p-5 text-sm">
            <input type="hidden" name="siteId" value={site.id} />
            {currentTheme.options.map((option) => (
              <label key={option.key} className="flex items-center justify-between gap-4">
                <span>{option.label}</span>
                {option.type === "color" ? (
                  <input
                    type="color"
                    name={`opt_${option.key}`}
                    defaultValue={String(themeConfig[option.key] ?? option.defaultValue)}
                    className="h-8 w-16 cursor-pointer rounded border border-neutral-300"
                  />
                ) : (
                  <input
                    type="checkbox"
                    name={`opt_${option.key}`}
                    defaultChecked={Boolean(themeConfig[option.key] ?? option.defaultValue)}
                    className="accent-wp-accent"
                  />
                )}
              </label>
            ))}
            <button className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark">
              保存并重新构建
            </button>
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
