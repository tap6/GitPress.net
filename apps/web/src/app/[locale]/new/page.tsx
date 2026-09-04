import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GitPressBrand } from "@/components/GitPressBrand";
import { NewSiteForm } from "@/components/NewSiteForm";
import { githubAppInstallUrl } from "@/lib/github";
import { noIndexMetadata } from "@/lib/seo";
import { listUserInstallations, requireUser } from "@/lib/sites";
import { BUILTIN_THEMES } from "@/lib/themes";

export const maxDuration = 60;

export async function generateMetadata() {
  const t = await getTranslations("newSite");
  return noIndexMetadata(t("metaTitle"));
}

export default async function NewSitePage() {
  const user = await requireUser();
  const t = await getTranslations("newSite");
  const installations = await listUserInstallations(user.id);

  let installUrl = "#";
  try {
    installUrl = githubAppInstallUrl();
  } catch {
    // GitHub App not configured yet — surfaced below.
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
            {t("back")}
          </Link>
          <GitPressBrand href={null} wordmarkClassName="text-lg font-bold tracking-tight" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>

        {installations.length === 0 ? (
          <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold">{t("connectTitle")}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-500">{t("connectBody")}</p>
            {installUrl === "#" ? (
              <p className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-700">{t("connectMissing")}</p>
            ) : (
              <a
                href={installUrl}
                className="mt-6 inline-block rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
              >
                {t("connectInstall")}
              </a>
            )}
          </div>
        ) : (
          <NewSiteForm
            installations={installations.map((installation) => ({
              id: installation.id,
              accountLogin: installation.accountLogin,
              label: `${installation.accountLogin} (${installation.accountType === "Organization" ? t("org") : t("personal")})`,
            }))}
            themes={BUILTIN_THEMES}
            connectMoreUrl={installUrl}
          />
        )}
      </main>
    </div>
  );
}
