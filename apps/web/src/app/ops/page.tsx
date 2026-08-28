import Link from "next/link";
import { formatOpsDate, githubRepoHref } from "@/lib/ops";
import { getOpsOverview } from "@/lib/opsQueries";
import { BUILTIN_THEMES } from "@/lib/themes";

export const metadata = { title: "运营总览" };

export default async function OpsHomePage() {
  const stats = await getOpsOverview();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-slate-900">总览</h1>
      <p className="mt-1 text-sm text-slate-500">
        控制面元数据。文章、图片与 AI 密钥明文都不在这里。
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="用户" value={stats.users} href="/ops/users" />
        <Stat label="站点" value={stats.sites} href="/ops/sites" />
        <Stat label="GitHub 安装" value={stats.installations} href="/ops/installations" />
        <Stat label="已配 AI" value={stats.aiConfigured} hint="只计有无,不读密钥" />
        <Stat label="商店上架" value={stats.themesListed} href="/ops/themes" />
        <Stat label="内置主题" value={BUILTIN_THEMES.length} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Breakdown title="按主题 name" rows={stats.byTheme} />
        <Breakdown title="按语言" rows={stats.byLanguage} />
        <Breakdown
          title="主题来源"
          rows={stats.bySourceKind.map((row) => ({
            key: row.key === "builtin" ? "内置" : "GitHub 导入",
            n: row.n,
          }))}
        />
      </div>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800">最近开通的站点</h2>
          <Link href="/ops/sites" className="text-xs text-ops-accent hover:underline">
            全部 →
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">站点</th>
                <th className="px-4 py-2 font-medium">站长</th>
                <th className="px-4 py-2 font-medium">主题</th>
                <th className="px-4 py-2 font-medium">开通</th>
                <th className="px-4 py-2 font-medium">链接</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    还没有站点
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
                            公开站 ↗
                          </a>
                        ) : (
                          <span className="text-slate-400">Pages 未开</span>
                        )}
                        <a
                          href={githubRepoHref(site.dataRepo)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:underline"
                        >
                          数据仓
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
}: {
  label: string;
  value: number;
  href?: string;
  hint?: string;
}) {
  const inner = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value.toLocaleString("zh-CN")}</p>
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

function Breakdown({ title, rows }: { title: string; rows: { key: string; n: number }[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">暂无数据</p>
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
