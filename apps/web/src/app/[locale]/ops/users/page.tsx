import { OpsSearch } from "@/components/OpsSearch";
import { emailIsOpsAllowlisted } from "@/lib/ops";
import { setUserOpsRoleAction } from "@/lib/opsActions";
import { listOpsUsers } from "@/lib/opsQueries";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("ops");
  return { title: t("usersTitle") };
}

export default async function OpsUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const t = await getTranslations("ops");
  const rows = await listOpsUsers(q);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-slate-900">{t("usersTitle")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("usersLead")}</p>
      <div className="mt-4">
        <OpsSearch action="/ops/users" q={q} placeholder={t("searchUsers")} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">{t("colAccount")}</th>
              <th className="px-4 py-2 font-medium">{t("colSites")}</th>
              <th className="px-4 py-2 font-medium">{t("colAi")}</th>
              <th className="px-4 py-2 font-medium">{t("colOps")}</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {t("noUsers")}
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
                      <p className="text-xs text-slate-500">{user.email ?? t("noEmail")}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400" title={user.id}>
                        {user.id}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{user.siteCount}</td>
                    <td className="px-4 py-2.5">{user.hasAi ? t("aiYes") : "—"}</td>
                    <td className="px-4 py-2.5">
                      {isOps ? (
                        <span className="rounded bg-teal-50 px-1.5 py-0.5 text-xs font-medium text-ops-accent">
                          {allowlisted ? t("allowlist") : t("role")}
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
                            title={allowlisted ? t("revokeHint") : undefined}
                          >
                            {t("revokeRole")}
                          </button>
                        </form>
                      ) : (
                        <form action={setUserOpsRoleAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="grant" value="1" />
                          <button type="submit" className="text-xs text-ops-accent hover:underline">
                            {t("grantOps")}
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
      <p className="mt-3 text-xs text-slate-400">{t("usersFoot")}</p>
    </div>
  );
}
