import { OpsSearch } from "@/components/OpsSearch";
import { emailIsOpsAllowlisted } from "@/lib/ops";
import { setUserOpsRoleAction } from "@/lib/opsActions";
import { listOpsUsers } from "@/lib/opsQueries";

export const metadata = { title: "用户" };

export default async function OpsUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const rows = await listOpsUsers(q);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-slate-900">用户</h1>
      <p className="mt-1 text-sm text-slate-500">
        账号与站点数量。不进入对方的 <code>/sites/…</code> 后台,也不解密 AI 密钥。
      </p>
      <div className="mt-4">
        <OpsSearch action="/ops/users" q={q} placeholder="搜索邮箱或名字" />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">账号</th>
              <th className="px-4 py-2 font-medium">站点</th>
              <th className="px-4 py-2 font-medium">AI</th>
              <th className="px-4 py-2 font-medium">运营</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  没有匹配的用户
                </td>
              </tr>
            ) : (
              rows.map((user) => {
                const allowlisted = emailIsOpsAllowlisted(user.email);
                const isOps = allowlisted || user.role === "ops";
                return (
                  <tr key={user.id} className="border-t border-slate-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-800">{user.name ?? "—"}</p>
                      <p className="text-xs text-slate-500">{user.email ?? "无邮箱"}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400" title={user.id}>
                        {user.id}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{user.siteCount}</td>
                    <td className="px-4 py-2.5">{user.hasAi ? "已配置" : "—"}</td>
                    <td className="px-4 py-2.5">
                      {isOps ? (
                        <span className="rounded bg-teal-50 px-1.5 py-0.5 text-xs font-medium text-ops-accent">
                          {allowlisted ? "白名单" : "角色"}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {user.role === "ops" ? (
                        <form action={setUserOpsRoleAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="grant" value="0" />
                          <button
                            type="submit"
                            className="text-xs text-slate-500 hover:text-red-600"
                            title={
                              allowlisted
                                ? "清掉数据库角色后,GITPRESS_OPS_EMAILS 仍会放行"
                                : undefined
                            }
                          >
                            撤销角色
                          </button>
                        </form>
                      ) : (
                        <form action={setUserOpsRoleAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="grant" value="1" />
                          <button type="submit" className="text-xs text-ops-accent hover:underline">
                            授予运营
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">最多显示 300 条。开通时间未记在用户表(Auth.js 标准表没有 createdAt)。</p>
    </div>
  );
}
