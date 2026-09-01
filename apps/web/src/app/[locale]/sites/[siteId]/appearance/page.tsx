import { saveThemeOptionsAction } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import { ThemeImportForm } from "@/components/ThemeImportForm";
import { ThemeShelf } from "@/components/ThemeShelf";
import { cachedSiteConfig } from "@/lib/siteDataCache";
import { listListedThemeCatalog } from "@/lib/themeCatalog";
import { ensureLegacyImportedThemeOnShelf, listSiteThemeLibrary } from "@/lib/themeLibrary";
import type { ThemeShelfItem } from "@/lib/themeShelf";
import {
  fetchGithubThemeManifest,
  githubThemePageUrl,
  githubThemePreviewUrl,
  parseGithubThemeSource,
} from "@/lib/themeSource";
import { Link } from "@/i18n/navigation";
import { BUILTIN_THEMES, getBuiltinTheme, themeOptionKey } from "@/lib/themes";
import { requireSite } from "@/lib/sites";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("appearance") };
}

export default async function AppearancePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const tt = await getTranslations("themes");
  const ta = await getTranslations("appearance");
  const tc = await getTranslations("common");
  const [config, catalog] = await Promise.all([
    cachedSiteConfig(installation.installationId, site.dataRepo),
    listListedThemeCatalog(),
  ]);
  const themeSource = String(config?.theme.source ?? site.themeSource ?? "builtin");
  const usingBuiltin = themeSource === "builtin";
  const currentTheme = usingBuiltin ? getBuiltinTheme(site.themeName) : null;
  const importedManifest = usingBuiltin ? null : await fetchGithubThemeManifest(themeSource);

  if (!usingBuiltin) {
    await ensureLegacyImportedThemeOnShelf({
      siteId: site.id,
      themeSource,
      manifest: importedManifest?.name ? { ...importedManifest, name: importedManifest.name } : null,
    });
  }

  const library = await listSiteThemeLibrary(site.id);
  const optionSchema = currentTheme?.configSchema ?? importedManifest?.configSchema;
  const optionTitle = currentTheme?.displayName ?? importedManifest?.displayName ?? site.themeName;
  const themeConfig = (site.themeConfig ?? {}) as Record<string, unknown>;
  const optionEntries = Object.entries(optionSchema?.properties ?? {});

  const official: ThemeShelfItem[] = BUILTIN_THEMES.map((theme) => ({
    id: theme.name,
    kind: "builtin",
    badge: "official",
    name: theme.name,
    displayName: theme.displayName,
    author: theme.author,
    description: tt.has(theme.name) ? tt(theme.name) : theme.description,
    previewSrc: theme.previewSrc,
    source: "builtin",
    version: theme.version,
    license: theme.license,
    homepage: theme.homepage,
    githubUrl: theme.homepage || "https://github.com/tap6/gitpress",
    active: usingBuiltin && theme.name === site.themeName,
  }));

  const listed: ThemeShelfItem[] = catalog.map((listing) => {
    const parsed = parseGithubThemeSource(listing.source);
    return {
      id: listing.id,
      kind: "catalog",
      badge: "listed",
      name: listing.name,
      displayName: listing.displayName,
      author: listing.author || parsed?.owner || "",
      description: listing.description,
      previewSrc: githubThemePreviewUrl(listing.source, listing.preview),
      source: listing.source,
      version: listing.version,
      license: listing.license,
      homepage: listing.homepage,
      githubUrl: parsed ? githubThemePageUrl(parsed) : null,
      active: !usingBuiltin && themeSource === listing.source,
    };
  });

  const mine: ThemeShelfItem[] = library.map((row) => {
    const parsed = parseGithubThemeSource(row.source);
    return {
      id: row.id,
      kind: "library",
      badge: null,
      name: row.name,
      displayName: row.displayName,
      author: row.author || parsed?.owner || "",
      description: row.description,
      previewSrc: githubThemePreviewUrl(row.source, row.preview),
      source: row.source,
      version: row.version,
      license: row.license,
      homepage: row.homepage,
      githubUrl: parsed ? githubThemePageUrl(parsed) : null,
      active: !usingBuiltin && themeSource === row.source,
    };
  });

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-normal text-neutral-800">{ta("title")}</h1>
      <p className="mt-1 text-sm text-neutral-500">{ta("lead")}</p>

      <ThemeShelf siteId={site.id} official={official} listed={listed} library={mine} />

      {optionEntries.length > 0 && (
        <div className="mt-8 max-w-lg rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">
            {ta("options", { name: optionTitle })}
          </h2>
          <form action={saveThemeOptionsAction} className="space-y-4 p-5 text-sm">
            <input type="hidden" name="siteId" value={site.id} />
            {optionEntries.map(([key, property]) => {
              const current = themeConfig[key] ?? property.default;
              const name = `opt_${key}`;
              return (
                <label key={key} className="flex items-center justify-between gap-4">
                  <span>
                    {(() => {
                      const resolved = themeOptionKey(key, property);
                      return resolved.kind === "known" ? tt(resolved.key) : resolved.text;
                    })()}
                  </span>
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
              pendingLabel={tc("saving")}
              buildSiteId={site.id}
              className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
            >
              {tc("saveRebuild")}
            </ProgressButton>
          </form>
        </div>
      )}

      <div className="mt-8 max-w-lg rounded border border-neutral-200 bg-white shadow-sm">
        <h2 className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3 text-sm font-semibold">
          {ta("addImport")}
          <Link
            href="/help/import-theme"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-wp-accent hover:underline"
          >
            {tc("helpLink")}
          </Link>
        </h2>
        <ThemeImportForm siteId={site.id} />
      </div>

      <p className="mt-6 text-xs text-neutral-400">
        {ta("footnoteBefore")}{" "}
        <Link href="/help/make-theme" className="underline hover:text-neutral-600">
          {ta("diy")}
        </Link>
        {ta("footnoteAfter")}
      </p>
    </div>
  );
}
