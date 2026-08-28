import { ConfirmForm } from "@/components/ConfirmForm";
import { ThemeListingForm } from "@/components/ThemeListingForm";
import {
  deleteThemeListingAction,
  refreshThemeListingAction,
  setThemeListingStatusAction,
} from "@/lib/opsActions";
import { listingStatusLabel, listAllThemeListings } from "@/lib/themeCatalog";
import { githubThemePageUrl, parseGithubThemeSource } from "@/lib/themeSource";
import { BUILTIN_THEMES } from "@/lib/themes";

export const metadata = { title: "主题商店" };

export default async function OpsThemesPage() {
  const listings = await listAllThemeListings();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-slate-900">主题商店</h1>
      <p className="mt-1 text-sm text-slate-500">
        目录是 GitHub 指针,不是 zip 包。内置主题来自 <code>tap6/gitpress@v1</code>,不写入这张表。
      </p>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-800">内置主题</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BUILTIN_THEMES.map((theme) => (
            <li key={theme.name} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-medium">{theme.displayName}</p>
              <p className="mt-1 font-mono text-[11px] text-slate-400">{theme.name}</p>
              <p className="mt-2 text-xs text-slate-500">{theme.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 max-w-lg rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold">上架 GitHub 主题</h2>
        <ThemeListingForm />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-800">目录</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">主题</th>
                <th className="px-4 py-2 font-medium">source</th>
                <th className="px-4 py-2 font-medium">状态</th>
                <th className="px-4 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    还没有商店条目。上架后会出现在站长的外观页。
                  </td>
                </tr>
              ) : (
                listings.map((listing) => {
                  const parsed = parseGithubThemeSource(listing.source);
                  return (
                    <tr key={listing.id} className="border-t border-slate-50 align-top">
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{listing.displayName}</p>
                        <p className="font-mono text-[11px] text-slate-400">{listing.name}</p>
                        {listing.description ? (
                          <p className="mt-1 text-xs text-slate-500">{listing.description}</p>
                        ) : null}
                        {listing.notes ? (
                          <p className="mt-1 text-xs text-amber-800">备注:{listing.notes}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-mono text-[11px] text-slate-600">{listing.source}</p>
                        {parsed ? (
                          <a
                            href={githubThemePageUrl(parsed)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs text-ops-accent hover:underline"
                          >
                            GitHub ↗
                          </a>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                            listing.status === "listed"
                              ? "bg-teal-50 text-ops-accent"
                              : listing.status === "pending"
                                ? "bg-amber-50 text-amber-800"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {listingStatusLabel(listing.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-2 text-xs">
                          {listing.status !== "listed" ? (
                            <StatusButton listingId={listing.id} status="listed" label="上架" />
                          ) : (
                            <StatusButton listingId={listing.id} status="hidden" label="下架" />
                          )}
                          {listing.status !== "pending" ? (
                            <StatusButton listingId={listing.id} status="pending" label="标为待审" />
                          ) : null}
                          <form action={refreshThemeListingAction}>
                            <input type="hidden" name="listingId" value={listing.id} />
                            <button type="submit" className="text-slate-500 hover:text-slate-800">
                              刷新元数据
                            </button>
                          </form>
                          <ConfirmForm
                            action={deleteThemeListingAction}
                            message={`从目录删除「${listing.displayName}」?已在用该主题的站点不受影响。`}
                          >
                            <input type="hidden" name="listingId" value={listing.id} />
                            <button type="submit" className="text-red-600 hover:underline">
                              删除
                            </button>
                          </ConfirmForm>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatusButton({
  listingId,
  status,
  label,
}: {
  listingId: string;
  status: "listed" | "hidden" | "pending";
  label: string;
}) {
  return (
    <form action={setThemeListingStatusAction}>
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className="text-ops-accent hover:underline">
        {label}
      </button>
    </form>
  );
}
