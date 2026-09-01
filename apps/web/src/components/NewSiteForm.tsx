"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createSiteAction, type CreateSiteState } from "@/lib/actions";
import { FormError } from "@/components/FormError";
import { ProgressButton } from "@/components/ProgressButton";
import { ThemePreviewImage } from "@/components/ThemePreviewImage";
import { siteLanguageForLocale } from "@/i18n/routing";
import type { BuiltinTheme } from "@/lib/themes";

interface Props {
  installations: Array<{ id: string; label: string }>;
  themes: BuiltinTheme[];
  connectMoreUrl: string;
}

export function NewSiteForm({ installations, themes, connectMoreUrl }: Props) {
  const t = useTranslations("newSite");
  const tt = useTranslations("themes");
  const locale = useLocale();
  const [state, formAction] = useActionState<CreateSiteState, FormData>(createSiteAction, {});
  const [selectedTheme, setSelectedTheme] = useState(themes[0]?.name ?? "");

  return (
    <form action={formAction} className="mt-8 space-y-8">
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="font-semibold">{t("stepInfo")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">{t("name")}</span>
            <input
              name="name"
              required
              placeholder={t("namePlaceholder")}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">{t("slug")}</span>
            <input
              name="slug"
              placeholder={t("slugPlaceholder")}
              pattern="[a-z0-9][a-z0-9\-]*"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
            />
            <span className="mt-1 block text-xs text-neutral-400">{t("slugHint")}</span>
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
                <ThemePreviewImage src={theme.previewSrc} alt={t("themePreview", { name: theme.displayName })} className="h-32" />
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

      <FormError error={state.error} />

      <ProgressButton
        expectedSeconds={20}
        pendingLabel={t("pending")}
        className="w-full rounded-md bg-gp-brand px-6 py-3 font-semibold text-white hover:opacity-90"
      >
        {t("submit")}
      </ProgressButton>
    </form>
  );
}
