import { OpsSearch } from "@/components/OpsSearch";
import { formatOpsDate, githubRepoHref } from "@/lib/ops";
import { listOpsSites } from "@/lib/opsQueries";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("ops");
  return { title: t("sitesTitle") };
}

export default async function OpsSitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const t = await getTranslations("ops");
  const rows = await listOpsSites(q);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-slate-900">{t("sitesTitle")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("sitesLead")}</p>
      <div className="mt-4">
        <OpsSearch action="/ops/sites" q={q} placeholder={t("searchSites")} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">{t("colSite")}</th>
              <th className="px-4 py-2 font-medium">{t("colOwner")}</th>
              <th className="px-4 py-2 font-medium">{t("colTheme")}</th>
              <th className="px-4 py-2 font-medium">{t("colRepos")}</th>
              <th className="px-4 py-2 font-medium">{t("colOpened")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {t("noMatchSites")}
                </td>
              </tr>
            ) : (
              rows.map((site) => (
                <tr key={site.id} className="border-t border-slate-50 align-top">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-800">{site.name}</p>
                    <p className="font-mono text-[11px] text-slate-400">{site.slug}</p>
                    <p className="mt-1 text-xs">
                      {site.url ? (
                        <a href={site.url} target="_blank" rel="noreferrer" className="text-ops-accent hover:underline">
                          {site.pagesEnabled ? t("publicSite") : t("publicUrl")}
                        </a>
                      ) : (
                        <span className="text-slate-400">{t("pagesOff")}</span>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <p>{site.ownerName ?? "—"}</p>
                    <p className="text-xs text-slate-500">{site.ownerEmail ?? ""}</p>
                    <p className="text-xs text-slate-400">GitHub @{site.accountLogin ?? "—"}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <p>{site.themeName}</p>
                    <p className="font-mono text-[11px] text-slate-400">{site.themeSource}</p>
                    <p className="mt-1 text-xs text-slate-400">{site.language}</p>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px]">
                    <a
                      href={githubRepoHref(site.dataRepo)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ops-accent hover:underline"
                    >
                      {site.dataRepo}
                    </a>
                    <span className="mt-1 block">
                      <a
                        href={githubRepoHref(site.siteRepo)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:underline"
                      >
                        {site.siteRepo}
                      </a>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">
                    {formatOpsDate(site.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">{t("sitesFoot")}</p>
    </div>
  );
}
