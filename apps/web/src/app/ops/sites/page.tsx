import { OpsSearch } from "@/components/OpsSearch";
import { formatOpsDate, githubRepoHref } from "@/lib/ops";
import { listOpsSites } from "@/lib/opsQueries";

export const metadata = { title: "站点" };

export default async function OpsSitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const rows = await listOpsSites(q);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-slate-900">站点</h1>
      <p className="mt-1 text-sm text-slate-500">
        只展示元数据与公开链接。运营不能打开别人的写作后台。
      </p>
      <div className="mt-4">
        <OpsSearch action="/ops/sites" q={q} placeholder="搜索名称、仓库、邮箱、主题" />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">站点</th>
              <th className="px-4 py-2 font-medium">站长</th>
              <th className="px-4 py-2 font-medium">主题</th>
              <th className="px-4 py-2 font-medium">仓库</th>
              <th className="px-4 py-2 font-medium">开通</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  没有匹配的站点
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
                          {site.pagesEnabled ? "公开站" : "URL"} ↗
                        </a>
                      ) : (
                        <span className="text-slate-400">Pages 未开</span>
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
      <p className="mt-3 text-xs text-slate-400">
        主题来源从本次上线起写入数据库。此前已从 GitHub 导入、之后没再换过主题的站点,这里可能仍显示
        builtin。
      </p>
    </div>
  );
}
