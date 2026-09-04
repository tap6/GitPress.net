"use client";

import { useActionState, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createSiteAction, type CreateSiteState } from "@/lib/actions";
import { AppErrorBoundary } from "@/components/AppErrorFallback";
import { FormError } from "@/components/FormError";
import { ProgressButton } from "@/components/ProgressButton";
import { ThemePreviewImage } from "@/components/ThemePreviewImage";
import { siteLanguageForLocale } from "@/i18n/routing";
import { resolveGithubRepoSlug, suggestedGithubRepoSlug } from "@/lib/githubRepoSlug";
import type { BuiltinTheme } from "@/lib/themes";

function repoSlugPreview(
  t: (key: string, values: { owner: string; slug: string }) => string,
  owner: string,
  slug: string,
): string {
  try {
    return t("slugPreview", { owner, slug });
  } catch {
    return `${owner}/${slug} · ${owner}/${slug}-data`;
  }
}

interface InstallationOption {
  id: string;
  accountLogin: string;
  label: string;
}

interface Props {
  installations: InstallationOption[];
  themes: BuiltinTheme[];
  connectMoreUrl: string;
}

export function NewSiteForm({ installations, themes, connectMoreUrl }: Props) {
  const [state, formAction, pending] = useActionState<CreateSiteState, FormData>(createSiteAction, {});

  return (
    <AppErrorBoundary>
      <form action={formAction} className="relative mt-8 space-y-8" aria-busy={pending}>
        <NewSiteFormFields
          installations={installations}
          themes={themes}
          connectMoreUrl={connectMoreUrl}
          error={state.error}
          pending={pending}
        />
      </form>
    </AppErrorBoundary>
  );
}

function NewSiteFormFields({
  installations,
  themes,
  connectMoreUrl,
  error,
  pending,
}: Props & { error?: string; pending: boolean }) {
  const t = useTranslations("newSite");
  const tt = useTranslations("themes");
  const locale = useLocale();
  const [selectedTheme, setSelectedTheme] = useState(themes[0]?.name ?? "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [installationId, setInstallationId] = useState(installations[0]?.id ?? "");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [slugTouched, setSlugTouched] = useState(false);

  const suggested = suggestedGithubRepoSlug(name);
  const resolved = resolveGithubRepoSlug(name, slug);
  const slugRequired = Boolean(name.trim()) && !suggested;
  const slugInvalid = slugTouched && !resolved;
  const owner =
    installations.find((installation) => installation.id === installationId)?.accountLogin ?? "";

  useEffect(() => {
    if (!pending) {
      setElapsedMs(0);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - start), 100);
    return () => clearInterval(timer);
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [pending]);

  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  useEffect(() => {
    if (!error || pending) return;
    document.querySelector("[data-form-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error, pending]);

  return (
    <div className="relative space-y-8">
      {error && !pending ? <FormError error={error} /> : null}

      <fieldset disabled={pending} className="space-y-8">
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="font-semibold">{t("stepInfo")}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium">{t("name")}</span>
                <input
                  name="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("namePlaceholder")}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">{t("slug")}</span>
                <input
                  name="slug"
                  value={slug}
                  required={slugRequired}
                  pattern="[a-z0-9][a-z0-9\-]*"
                  onChange={(event) => {
                    setSlug(event.target.value);
                    setSlugTouched(true);
                  }}
                  placeholder={t("slugPlaceholder")}
                  aria-invalid={slugInvalid}
                  className={`mt-1 w-full rounded-md border px-3 py-2 focus:outline-none ${
                    slugInvalid
                      ? "border-red-400 focus:border-red-500"
                      : "border-neutral-300 focus:border-wp-accent"
                  }`}
                />
                {resolved && owner ? (
                  <span className="mt-1 block text-xs text-neutral-500">
                    {repoSlugPreview(t, owner, resolved)}
                  </span>
                ) : slugRequired ? (
                  <span className="mt-1 block text-xs text-red-600">{t("slugNeeded")}</span>
                ) : (
                  <span className="mt-1 block text-xs text-neutral-400">{t("slugHint")}</span>
                )}
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium">{t("description")}</span>
                <input
                  name="description"
                  placeholder={t("descriptionPlaceholder")}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">{t("language")}</span>
                <select
                  name="language"
                  defaultValue={siteLanguageForLocale(locale)}
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2"
                >
                  <option value="zh-CN">{t("langZh")}</option>
                  <option value="en">{t("langEn")}</option>
                  <option value="ja">{t("langJa")}</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">{t("githubAccount")}</span>
                <select
                  name="installation"
                  value={installationId}
                  onChange={(event) => setInstallationId(event.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2"
                >
                  {installations.map((installation) => (
                    <option key={installation.id} value={installation.id}>
                      {installation.label}
                    </option>
                  ))}
                </select>
                <a href={connectMoreUrl} className="mt-1 block text-xs text-wp-accent hover:underline">
                  {t("connectMore")}
                </a>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="font-semibold">{t("stepTheme")}</h2>
            <p className="mt-1 text-xs text-neutral-400">{t("themeHint")}</p>
            <input type="hidden" name="theme" value={selectedTheme} />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {themes.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => setSelectedTheme(theme.name)}
                  className={`overflow-hidden rounded-xl border-2 text-left transition ${
                    selectedTheme === theme.name
                      ? "border-wp-accent shadow-md"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div className="relative">
                    <ThemePreviewImage
                      src={theme.previewSrc}
                      alt={t("themePreview", { name: theme.displayName })}
                      className="h-32"
                    />
                    <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {t("official")}
                    </span>
                  </div>
                  <div className="border-t border-neutral-100 bg-white p-3">
                    <p className="text-sm font-semibold">{theme.displayName}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">{theme.author}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {tt.has(theme.name) ? tt(theme.name) : theme.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </fieldset>

      <ProgressButton
        wide
        expectedSeconds={40}
        announceBuild={false}
        error={error}
        pendingLabel={t("pending")}
        className="w-full rounded-md bg-gp-brand px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-80"
      >
        {t("submit")}
      </ProgressButton>

      {pending && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/90 p-6"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="max-w-md text-center">
            <p className="font-semibold text-neutral-900">{t("busyTitle")}</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{t("busyBody")}</p>
            <p className="mt-3 text-sm tabular-nums text-neutral-500">
              {t("busyElapsed", { n: elapsedSeconds })}
            </p>
            <p className="mt-3 text-xs text-neutral-400">{t("stayOnPage")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
