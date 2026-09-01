import { Link } from "@/i18n/navigation";
import { formatOpsDate, githubRepoHref } from "@/lib/ops";
import { getOpsOverview } from "@/lib/opsQueries";
import { BUILTIN_THEMES } from "@/lib/themes";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("ops");
  return { title: t("overview") };
}

export default async function OpsHomePage() {
  const t = await getTranslations("ops");
  const locale = await getLocale();
  const numberLocale = locale === "en" ? "en" : "zh-CN";
  const stats = await getOpsOverview();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-slate-900">{t("homeTitle")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("homeLead")}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label={t("users")} value={stats.users} href="/ops/users" numberLocale={numberLocale} />
        <Stat label={t("sites")} value={stats.sites} href="/ops/sites" numberLocale={numberLocale} />
        <Stat label={t("installations")} value={stats.installations} href="/ops/installations" numberLocale={numberLocale} />
        <Stat label={t("aiConfigured")} value={stats.aiConfigured} hint={t("aiHint")} numberLocale={numberLocale} />
        <Stat label={t("themesListed")} value={stats.themesListed} href="/ops/themes" numberLocale={numberLocale} />
        <Stat label={t("builtinThemes")} value={BUILTIN_THEMES.length} numberLocale={numberLocale} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Breakdown title={t("byTheme")} rows={stats.byTheme} empty={t("noData")} />
        <Breakdown title={t("byLanguage")} rows={stats.byLanguage} empty={t("noData")} />
        <Breakdown
          title={t("bySource")}
          empty={t("noData")}
          rows={stats.bySourceKind.map((row) => ({
            key: row.key === "builtin" ? t("sourceBuiltin") : t("sourceGithub"),
            n: row.n,
          }))}
        />
      </div>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800">{t("recentSites")}</h2>
          <Link href="/ops/sites" className="text-xs text-ops-accent hover:underline">
            {t("allArrow")}
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">{t("colSite")}</th>
                <th className="px-4 py-2 font-medium">{t("colOwner")}</th>
                <th className="px-4 py-2 font-medium">{t("colTheme")}</th>
                <th className="px-4 py-2 font-medium">{t("colOpened")}</th>
                <th className="px-4 py-2 font-medium">{t("colLinks")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    {t("noSites")}
                  </td>
                </tr>
              ) : (
                stats.recentSites.map((site) => (
                  <tr key={site.id} className="border-t border-slate-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-800">{site.name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{site.slug}</p>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {site.ownerName ?? "—"}
                      <span className="mt-0.5 block text-xs text-slate-400">{site.ownerEmail ?? ""}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-slate-700">{site.themeName}</span>
                      <span className="mt-0.5 block font-mono text-[11px] text-slate-400">
                        {site.themeSource}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">
                      {formatOpsDate(site.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <div className="flex flex-col gap-1">
                        {site.url ? (
                          <a href={site.url} target="_blank" rel="noreferrer" className="text-ops-accent hover:underline">
                            {t("publicSite")}
                          </a>
                        ) : (
                          <span className="text-slate-400">{t("pagesOff")}</span>
                        )}
                        <a
                          href={githubRepoHref(site.dataRepo)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:underline"
                        >
                          {t("dataRepo")}
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  hint,
  numberLocale,
}: {
  label: string;
  value: number;
  href?: string;
  hint?: string;
  numberLocale: string;
}) {
  const inner = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value.toLocaleString(numberLocale)}</p>
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-ops-accent">
        {inner}
      </Link>
    );
  }
  return <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">{inner}</div>;
}

function Breakdown({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { key: string; n: number }[];
  empty: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {rows.map((row) => (
            <li key={row.key} className="flex justify-between gap-3">
              <span className="truncate text-slate-600">{row.key || "—"}</span>
              <span className="tabular-nums text-slate-900">{row.n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
