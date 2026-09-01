import { cookies } from "next/headers";
import { redirect as nextRedirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth, providerIds, signIn } from "@/auth";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { localeAlternates } from "@/i18n/alternates";
import { getPathname, redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import {
  GITHUB_SETUP_COOKIE,
  GITHUB_SETUP_RESUME_PATH,
  parsePendingGithubSetup,
} from "@/lib/githubSetupPending";
import { maybeRedirectToPreferredLocale } from "@/lib/productLocale";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("login"), alternates: localeAlternates("/login") };
}

export default async function LoginPage() {
  await maybeRedirectToPreferredLocale("/login");
  const session = await auth();
  const locale = (await getLocale()) as AppLocale;
  const pendingGithub = parsePendingGithubSetup((await cookies()).get(GITHUB_SETUP_COOKIE)?.value);
  if (session?.user) {
    if (pendingGithub) nextRedirect(GITHUB_SETUP_RESUME_PATH);
    redirect({ href: "/dashboard", locale });
  }
  const t = await getTranslations("login");
  const dashboard = getPathname({ href: "/dashboard", locale });
  const afterLogin = pendingGithub ? GITHUB_SETUP_RESUME_PATH : dashboard;

  const labels: Record<string, string> = {
    google: t("google"),
    github: t("github"),
    "microsoft-entra-id": t("microsoft"),
    twitter: t("twitter"),
  };
  const classes: Record<string, string> = {
    google: "bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50",
    github: "bg-neutral-900 text-white hover:bg-neutral-700",
    "microsoft-entra-id": "bg-[#2f2f2f] text-white hover:bg-[#444]",
    twitter: "bg-black text-white hover:bg-neutral-800",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex justify-end">
          <LocaleSwitcher />
        </div>
        <p className="text-center text-2xl font-bold tracking-tight">
          Git<span className="text-gp-brand">Press</span>
        </p>
        <p className="mt-2 text-center text-sm text-neutral-500">{t("lead")}</p>
        {pendingGithub ? (
          <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{t("pendingGithub")}</p>
        ) : null}
        <div className="mt-8 space-y-3">
          {providerIds.length === 0 && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">{t("unconfigured")}</p>
          )}
          {providerIds.map((id) => {
            const label = labels[id] ?? t("other", { id });
            const className = classes[id] ?? "bg-neutral-900 text-white";
            return (
              <form
                key={id}
                action={async () => {
                  "use server";
                  await signIn(id, { redirectTo: afterLogin });
                }}
              >
                <button
                  type="submit"
                  className={`w-full rounded-md px-4 py-2.5 text-sm font-medium transition ${className}`}
                >
                  {label}
                </button>
              </form>
            );
          })}
        </div>
        <p className="mt-8 text-center text-xs text-neutral-400">{t("independent")}</p>
        {providerIds.includes("github") && (
          <p className="mt-2 text-center text-xs text-neutral-400">
            {t("githubSwitch")}{" "}
            <a
              href="https://github.com/logout"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-neutral-600"
            >
              {t("githubLogout")}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
