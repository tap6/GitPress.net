import { Link, getPathname } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { signOut } from "@/auth";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { GitPressBrand } from "@/components/GitPressBrand";
import { PermissionUpdateBanner } from "@/components/PermissionUpdateBanner";
import { userHasOpsAccess } from "@/lib/ops";
import { noIndexMetadata } from "@/lib/seo";
import { getInstallationPermissionGap } from "@/lib/github";
import { listUserInstallations, listUserSites, requireUser } from "@/lib/sites";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata() {
  const t = await getTranslations("dashboard");
  return noIndexMetadata(t("title"));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ github?: string }>;
}) {
  const { github } = await searchParams;
  const user = await requireUser();
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("dashboard");
  const tn = await getTranslations("nav");
  const ts = await getTranslations("newSite");
  const home = getPathname({ href: "/", locale });
  const isOps = await userHasOpsAccess(user);
  const [userSites, installations] = await Promise.all([
    listUserSites(user.id),
    listUserInstallations(user.id),
  ]);
  const permissionGaps = (
    await Promise.all(installations.map((row) => getInstallationPermissionGap(row.installationId)))
  ).filter((gap) => gap != null);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
          <GitPressBrand href="/" wordmarkClassName="text-lg font-bold tracking-tight" />
          <div className="flex flex-wrap items-center gap-3 text-sm sm:gap-4">
            <Link href="/account/ai" className="text-neutral-500 hover:text-neutral-900">
              {tn("aiSettings")}
            </Link>
            {isOps && (
              <Link href="/ops" className="font-medium text-ops-accent hover:text-teal-800">
                {tn("ops")}
              </Link>
            )}
            <LocaleSwitcher />
            <span className="hidden max-w-[10rem] truncate text-neutral-500 sm:inline">
              {user.name ?? user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: home });
              }}
            >
              <button className="text-neutral-400 hover:text-neutral-700">{tn("signOut")}</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {github === "permissions-updated" && (
          <div className="mb-6 rounded-md border-l-4 border-emerald-500 bg-white p-4 text-sm shadow-sm">
            {t("permissionsUpdated")}
          </div>
        )}
        {permissionGaps.map((gap) => (
          <div key={gap.installationId} className="mb-4">
            <PermissionUpdateBanner gap={gap} compact />
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <Link
            href="/new"
            className="rounded-md bg-gp-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {t("create")}
          </Link>
        </div>

        {userSites.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <p className="text-lg font-medium">{t("emptyTitle")}</p>
            <p className="mt-2 text-sm text-neutral-500">{ts("emptyHint")}</p>
            <Link
              href="/new"
              className="mt-6 inline-block rounded-md bg-gp-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {ts("firstSite")}
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {userSites.map((site) => (
              <li
                key={site.id}
                className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/sites/${site.id}`}
                    className="font-semibold hover:text-gp-brand"
                  >
                    {site.name}
                  </Link>
                  <p className="mt-1 truncate text-xs text-neutral-400">
                    {site.dataRepo} · {ts("themeLine", { name: site.themeName })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {site.url && (
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-500 hover:text-neutral-900"
                    >
                      {ts("visit")}
                    </a>
                  )}
                  <Link
                    href={`/sites/${site.id}`}
                    className="rounded-md bg-wp-accent px-3 py-1.5 font-medium text-white hover:bg-wp-accent-dark"
                  >
                    {ts("manage")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
