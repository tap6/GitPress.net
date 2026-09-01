import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { LandingDashboardPreview } from "@/components/LandingDashboardPreview";
import { QqGroupFloat } from "@/components/QqGroupFloat";
import { localeAlternates } from "@/i18n/alternates";
import type { AppLocale } from "@/i18n/routing";
import { maybeRedirectToPreferredLocale } from "@/lib/productLocale";
import { formatStatCount, getPublicPlatformStats } from "@/lib/publicStats";

const PLATFORM_REPO = "https://github.com/tap6/GitPress.net";
const GITPRESS_REPO = "https://github.com/tap6/gitpress";
const BUILD_ACTION_REPO = "https://github.com/tap6/build-action";

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("title"), description: t("description"), alternates: localeAlternates("/") };
}

export default async function LandingPage() {
  await maybeRedirectToPreferredLocale("/");
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("landing");
  const tn = await getTranslations("nav");
  const [session, stats] = await Promise.all([auth(), getPublicPlatformStats()]);
  const FEATURES = [
    { title: t("f1Title"), body: t("f1Body") },
    { title: t("f2Title"), body: t("f2Body") },
    { title: t("f3Title"), body: t("f3Body") },
    { title: t("f4Title"), body: t("f4Body") },
  ];
  const STEPS = [
    { title: t("step1Title"), body: t("step1Body") },
    { title: t("step2Title"), body: t("step2Body") },
    { title: t("step3Title"), body: t("step3Body") },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-5">
        <p className="text-xl font-bold tracking-tight">
          Git<span className="text-gp-brand">Press</span>
        </p>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/privacy" className="text-neutral-500 hover:text-neutral-900">
            {tn("privacy")}
          </Link>
          <Link href="/help" className="text-neutral-500 hover:text-neutral-900">
            {tn("help")}
          </Link>
          <a href="#open-source" className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900">
            <GitHubMark className="h-4 w-4" />
            {tn("source")}
          </a>
          <LocaleSwitcher />
          {session?.user ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700"
            >
              {tn("console")}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700"
            >
              {tn("login")}
            </Link>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 pb-14 pt-16 text-center sm:pt-20">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">
            {t("kicker")}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {t("h1a")}
            <br />
            {t("h1b")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-500">
            {t("lead")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={session?.user ? "/new" : "/login"}
              className="rounded-md bg-gp-brand px-6 py-3 font-semibold text-white hover:opacity-90"
            >
              {t("ctaCreate")}
            </Link>
            <Link
              href="/help/what-is-gitpress"
              className="rounded-md border border-neutral-300 px-6 py-3 font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {t("ctaWhat")}
            </Link>
            <a
              href="#open-source"
              className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-6 py-3 font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <GitHubMark className="h-4 w-4" />
              {t("ctaSource")}
            </a>
          </div>
          <LandingDashboardPreview
            src={locale === "en" ? "/landing/dashboard-en.webp" : "/landing/dashboard-zh.webp"}
          />
          <p className="mt-12 text-sm text-neutral-500">
            {t("statsNote")}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: t("statUsers"), value: stats.users },
              { label: t("statSites"), value: stats.sites },
              { label: t("statGithub"), value: stats.githubConnections },
              { label: t("statThemes"), value: stats.themes },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-5 text-center shadow-sm"
              >
                <dt className="text-xs text-neutral-400">{item.label}</dt>
                <dd className="mt-2 text-3xl font-light tabular-nums text-neutral-900">
                  {formatStatCount(item.value, locale)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          id="open-source"
          className="scroll-mt-8 border-y border-neutral-200 bg-neutral-50 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">{t("ossKicker")}</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
              {t("ossH2a")}
              <br />
              {t("ossH2b")}
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-neutral-600">{t("ossLead")}</p>
            <div className="mt-10 grid gap-4">
              <a
                href={PLATFORM_REPO}
                className="group rounded-2xl bg-gp-brand p-7 text-white shadow-md hover:opacity-95 sm:p-8"
                target="_blank"
                rel="noreferrer"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{t("ossPlatformKicker")}</p>
                <p className="mt-3 inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  <GitHubMark className="h-7 w-7" />
                  tap6/GitPress.net
                </p>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/90">
                  {t("ossPlatformBody")}
                </p>
                <p className="mt-5 text-sm font-semibold text-white group-hover:underline">{t("openGithub")}</p>
              </a>
              <div className="grid gap-4 md:grid-cols-2">
                <a
                  href={GITPRESS_REPO}
                  className="group rounded-2xl border border-sky-200 bg-white p-6 shadow-sm hover:border-sky-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{t("ossThemesKicker")}</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-xl font-semibold text-neutral-900">
                    <GitHubMark className="h-5 w-5" />
                    tap6/gitpress
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    {t("ossThemesBody")}
                  </p>
                  <p className="mt-4 text-sm font-medium text-sky-800 group-hover:underline">{t("openGithub")}</p>
                </a>
                <a
                  href={BUILD_ACTION_REPO}
                  className="group rounded-2xl border border-violet-200 bg-white p-6 shadow-sm hover:border-violet-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">{t("ossBuildKicker")}</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-xl font-semibold text-neutral-900">
                    <GitHubMark className="h-5 w-5" />
                    tap6/build-action
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    {t("ossBuildBody")}
                  </p>
                  <p className="mt-4 text-sm font-medium text-violet-800 group-hover:underline">{t("openGithub")}</p>
                </a>
              </div>
            </div>
            <p className="mt-8 text-sm text-neutral-500">
              {t.rich("ossSeeAlso", {
                what: () => (
                  <Link href="/help/what-is-gitpress" className="font-medium text-neutral-800 underline hover:text-neutral-950">
                    {t("ctaWhat")}
                  </Link>
                ),
                privacy: () => (
                  <Link href="/privacy" className="font-medium text-neutral-800 underline hover:text-neutral-950">
                    {tn("privacy")}
                  </Link>
                ),
              })}
            </p>
          </div>
        </section>

        <section id="how-it-works" className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold">{t("stepsTitle")}</h2>
              <p className="mt-2 text-neutral-500">{t("stepsLead")}</p>
            </div>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-neutral-100 bg-neutral-950 py-16 text-neutral-100">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold">{t("reposTitle")}</h2>
              <p className="mt-3 leading-relaxed text-neutral-400">{t("reposLead")}</p>
              <ul className="mt-6 space-y-3 text-sm text-neutral-300">
                <li>{t("repoData")}</li>
                <li>{t("repoSite")}</li>
                <li>{t("repoActions")}</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 font-mono text-xs leading-6 text-neutral-300">
              <p className="text-neutral-500">{t("diagramComment")}</p>
              <p>{t("diagramData")}</p>
              <p className="pl-4">content/posts/*.md</p>
              <p className="pl-4">media/*.jpg · *.mp4</p>
              <p className="pl-4">gitpress.json</p>
              <p className="mt-3">{t("diagramSite")}</p>
              <p className="pl-4">index.html · posts/ · media/</p>
              <p className="mt-4 text-emerald-400/90">{t("diagramHost")}</p>
            </div>
          </div>
        </section>

        <section id="features" className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-2xl font-semibold">{t("featuresTitle")}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-100 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold">{t("aiTitle")}</h2>
              <p className="mt-2 text-neutral-500">{t("aiLead")}</p>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                { title: t("ai1Title"), body: t("ai1Body") },
                { title: t("ai2Title"), body: t("ai2Body") },
                { title: t("ai3Title"), body: t("ai3Body") },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{item.body}</p>
                </div>
              ))}
            </div>
            <Link
              href="/help/make-theme"
              className="mt-8 inline-block rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              {t("aiCta")}
            </Link>
          </div>
        </section>

        <section className="border-t border-neutral-100 bg-neutral-50 py-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-2xl font-semibold">{t("readyTitle")}</h2>
            <p className="mt-3 text-neutral-500">
              {t("readyBody", { users: formatStatCount(stats.users, locale), sites: formatStatCount(stats.sites, locale) })}
            </p>
            <Link
              href={session?.user ? "/new" : "/login"}
              className="mt-6 inline-block rounded-md bg-gp-brand px-8 py-3 font-semibold text-white hover:opacity-90"
            >
              {session?.user ? t("readyLoggedIn") : t("readyGuest")}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-100 py-10 text-center text-sm text-neutral-400">
        <p>© {new Date().getFullYear()} GitPress.net</p>
        <p className="mt-1">
            <Link href="/privacy" className="text-neutral-500 hover:text-neutral-800">
              {tn("privacy")}
            </Link>
            {" · "}
            <Link href="/help" className="text-neutral-500 hover:text-neutral-800">
              {tn("help")}
            </Link>
            {" · "}
            <Link href="/help/what-is-gitpress" className="text-neutral-500 hover:text-neutral-800">
              {t("ctaWhat")}
            </Link>
            {" · "}
            <a href="#open-source" className="text-neutral-500 hover:text-neutral-800">
              {t("sourceLicense")}
            </a>
        </p>
      </footer>
      {locale === "zh" ? <QqGroupFloat /> : null}
    </div>
  );
}
