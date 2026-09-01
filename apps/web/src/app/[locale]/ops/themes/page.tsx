import { ConfirmForm } from "@/components/ConfirmForm";
import { ThemeListingForm } from "@/components/ThemeListingForm";
import {
  deleteThemeListingAction,
  refreshThemeListingAction,
  setThemeListingStatusAction,
} from "@/lib/opsActions";
import { listingStatusKey, listAllThemeListings } from "@/lib/themeCatalog";
import { githubThemePageUrl, parseGithubThemeSource } from "@/lib/themeSource";
import { ThemePreviewImage } from "@/components/ThemePreviewImage";
import { BUILTIN_THEMES } from "@/lib/themes";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("ops");
  return { title: t("storeTitle") };
}

export default async function OpsThemesPage() {
  const t = await getTranslations("ops");
  const tt = await getTranslations("themes");
  const tc = await getTranslations("common");
  const listings = await listAllThemeListings();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-slate-900">{t("storeTitle")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("storeLead")}</p>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-800">{t("builtinSection")}</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BUILTIN_THEMES.map((theme) => (
            <li key={theme.name} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <ThemePreviewImage
                src={theme.previewSrc}
                alt={t("previewAlt", { name: theme.displayName })}
                className="h-24"
              />
              <div className="p-4">
                <p className="font-medium">{theme.displayName}</p>
                <p className="mt-1 font-mono text-[11px] text-slate-400">{theme.name}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {tt.has(theme.name) ? tt(theme.name) : theme.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 max-w-lg rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold">{t("listGithub")}</h2>
        <ThemeListingForm />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-800">{t("catalog")}</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">{t("colTheme")}</th>
                <th className="px-4 py-2 font-medium">{t("colSource")}</th>
                <th className="px-4 py-2 font-medium">{t("colStatus")}</th>
                <th className="px-4 py-2 font-medium">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    {t("emptyCatalog")}
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
                          <p className="mt-1 text-xs text-amber-800">{t("notes", { notes: listing.notes })}</p>
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
                            {t("githubArrow")}
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
                          {t(listingStatusKey(listing.status))}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-2 text-xs">
                          {listing.status !== "listed" ? (
                            <StatusButton listingId={listing.id} status="listed" label={t("list")} />
                          ) : (
                            <StatusButton listingId={listing.id} status="hidden" label={t("unlist")} />
                          )}
                          {listing.status !== "pending" ? (
                            <StatusButton listingId={listing.id} status="pending" label={t("markPending")} />
                          ) : null}
                          <form action={refreshThemeListingAction}>
                            <input type="hidden" name="listingId" value={listing.id} />
                            <button type="submit" className="text-slate-500 hover:text-slate-800">
                              {t("refreshMeta")}
                            </button>
                          </form>
                          <ConfirmForm
                            action={deleteThemeListingAction}
                            message={t("confirmDeleteListing", { name: listing.displayName })}
                          >
                            <input type="hidden" name="listingId" value={listing.id} />
                            <button type="submit" className="text-red-600 hover:underline">
                              {tc("delete")}
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
