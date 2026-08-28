import { formatOpsDate } from "@/lib/ops";
import { listOpsInstallations } from "@/lib/opsQueries";

export const metadata = { title: "GitHub 安装" };

export default async function OpsInstallationsPage() {
  const rows = await listOpsInstallations();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-slate-900">GitHub 安装</h1>
      <p className="mt-1 text-sm text-slate-500">
        GitHub App 安装映射。不展示 user-to-server token。
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">账号</th>
              <th className="px-4 py-2 font-medium">站长</th>
              <th className="px-4 py-2 font-medium">Installation</th>
              <th className="px-4 py-2 font-medium">站点</th>
              <th className="px-4 py-2 font-medium">接入</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  还没有 GitHub App 安装
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-50">
                  <td className="px-4 py-2.5">
                    <a
                      href={`https://github.com/${row.accountLogin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-ops-accent hover:underline"
                    >
                      @{row.accountLogin}
                    </a>
                    <p className="text-xs text-slate-400">{row.accountType}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <p>{row.ownerName ?? "—"}</p>
                    <p className="text-xs text-slate-500">{row.ownerEmail ?? ""}</p>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{row.installationId}</td>
                  <td className="px-4 py-2.5 tabular-nums">{row.siteCount}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">
                    {formatOpsDate(row.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
