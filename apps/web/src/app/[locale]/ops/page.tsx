import { Link } from "@/i18n/navigation";
import { formatOpsDate, githubRepoHref } from "@/lib/ops";
import { OPS_TREND_DAYS, getOpsOverview, type OpsDayCount } from "@/lib/opsQueries";
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

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Stat
          label={t("last30Users")}
          value={sumSeries(stats.series.users)}
          hint={t("last30Hint", { n: OPS_TREND_DAYS })}
          href="/ops/users"
          swatchClass="bg-ops-accent"
          numberLocale={numberLocale}
        />
        <Stat
          label={t("last30Installs")}
          value={sumSeries(stats.series.installations)}
          hint={t("last30Hint", { n: OPS_TREND_DAYS })}
          href="/ops/installations"
          swatchClass="bg-sky-700"
          numberLocale={numberLocale}
        />
        <Stat
          label={t("last30Sites")}
          value={sumSeries(stats.series.sites)}
          hint={t("last30Hint", { n: OPS_TREND_DAYS })}
          href="/ops/sites"
          swatchClass="bg-teal-900"
          numberLocale={numberLocale}
        />
      </div>

      <div className="mt-8">
        <CombinedTrend
          title={t("trendCombined")}
          lead={t("trendCombinedLead")}
          utcHint={t("trendUtc")}
          users={stats.series.users}
          installations={stats.series.installations}
          sites={stats.series.sites}
          labels={{
            users: t("trendUsers"),
            installations: t("trendInstalls"),
            sites: t("trendSites"),
          }}
        />
      </div>
      {stats.usersUnknownCreated > 0 ? (
        <p className="mt-2 text-[11px] text-slate-400">
          {t("usersUnknownCreated", { n: stats.usersUnknownCreated })}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Funnel
          title={t("funnelTitle")}
          lead={t("funnelLead")}
          numberLocale={numberLocale}
          steps={[
            { label: t("funnelUsers"), n: stats.funnel.users },
            { label: t("funnelGithub"), n: stats.funnel.usersWithGithub },
            { label: t("funnelHasSite"), n: stats.funnel.usersWithSite },
            { label: t("funnelSites"), n: stats.funnel.sites },
            { label: t("funnelPagesOn"), n: stats.funnel.sitesPagesOn },
            { label: t("funnelHasUrl"), n: stats.funnel.sitesWithUrl },
          ]}
        />
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">{t("stuckTitle")}</h2>
          <p className="mt-1 text-xs text-slate-400">{t("stuckLead")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StuckStat href="/ops/users" label={t("stuckNoGithub")} value={stats.stuck.usersNoGithub} numberLocale={numberLocale} />
            <StuckStat href="/ops/installations" label={t("stuckInstallNoSite")} value={stats.stuck.installsNoSite} numberLocale={numberLocale} />
            <StuckStat href="/ops/sites" label={t("stuckPagesOff")} value={stats.stuck.sitesPagesOff} numberLocale={numberLocale} />
            <StuckStat href="/ops/sites" label={t("stuckNoUrl")} value={stats.stuck.sitesNoUrl} numberLocale={numberLocale} />
          </div>
        </div>
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
                      {formatOpsDate(site.createdAt, locale)}
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

function sumSeries(series: OpsDayCount[]): number {
  return series.reduce((total, row) => total + row.n, 0);
}

function barHeight(n: number, max: number): string {
  if (n === 0) return "0";
  return `${Math.max(8, (n / max) * 100)}%`;
}

function CombinedTrend({
  title,
  lead,
  utcHint,
  users,
  installations,
  sites,
  labels,
}: {
  title: string;
  lead: string;
  utcHint: string;
  users: OpsDayCount[];
  installations: OpsDayCount[];
  sites: OpsDayCount[];
  labels: { users: string; installations: string; sites: string };
}) {
  const days = users.map((row, index) => ({
    day: row.day,
    users: row.n,
    installations: installations[index]?.n ?? 0,
    sites: sites[index]?.n ?? 0,
  }));
  const max = Math.max(1, ...days.flatMap((row) => [row.users, row.installations, row.sites]));
  const first = days[0]?.day;
  const last = days[days.length - 1]?.day;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-xs text-slate-400">{lead}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-ops-accent" />
          {labels.users}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-sky-700" />
          {labels.installations}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-teal-900" />
          {labels.sites}
        </span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <div className="flex h-36 min-w-[40rem] items-end gap-px">
          {days.map((row) => (
            <div
              key={row.day}
              title={`${row.day}  ${labels.users} ${row.users} · ${labels.installations} ${row.installations} · ${labels.sites} ${row.sites}`}
              className="flex min-w-0 flex-1 items-end justify-center gap-px"
            >
              <div className="min-w-0 flex-1 rounded-t bg-ops-accent" style={{ height: barHeight(row.users, max) }} />
              <div className="min-w-0 flex-1 rounded-t bg-sky-700" style={{ height: barHeight(row.installations, max) }} />
              <div className="min-w-0 flex-1 rounded-t bg-teal-900" style={{ height: barHeight(row.sites, max) }} />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        {first && last ? `${first} → ${last}` : null} · {utcHint}
      </p>
    </div>
  );
}

function Funnel({
  title,
  lead,
  steps,
  numberLocale,
}: {
  title: string;
  lead: string;
  steps: { label: string; n: number }[];
  numberLocale: string;
}) {
  const max = Math.max(1, ...steps.map((step) => step.n));
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-xs text-slate-400">{lead}</p>
      <ul className="mt-4 space-y-3">
        {steps.map((step) => (
          <li key={step.label}>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-slate-600">{step.label}</span>
              <span className="tabular-nums text-slate-900">{step.n.toLocaleString(numberLocale)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-100">
              <div className="h-full rounded bg-ops-accent" style={{ width: `${(step.n / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StuckStat({
  label,
  value,
  href,
  numberLocale,
}: {
  label: string;
  value: number;
  href: string;
  numberLocale: string;
}) {
  return (
    <Link href={href} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 hover:border-ops-accent">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{value.toLocaleString(numberLocale)}</p>
    </Link>
  );
}

function Stat({
  label,
  value,
  href,
  hint,
  swatchClass,
  numberLocale,
}: {
  label: string;
  value: number;
  href?: string;
  hint?: string;
  swatchClass?: string;
  numberLocale: string;
}) {
  const inner = (
    <>
      {swatchClass ? <span className={`mb-2 inline-block h-1.5 w-6 rounded ${swatchClass}`} /> : null}
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
