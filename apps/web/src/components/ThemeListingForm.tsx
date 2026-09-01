"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addThemeListingAction, type OpsFormState } from "@/lib/opsActions";
import { FormError } from "@/components/FormError";

export function ThemeListingForm() {
  const t = useTranslations("ops");
  const [state, formAction] = useActionState<OpsFormState, FormData>(addThemeListingAction, {});

  return (
    <form action={formAction} className="space-y-3 p-5 text-sm">
      <label className="block">
        <span className="font-medium">{t("repo")}</span>
        <input
          name="repo"
          required
          placeholder="owner/repo or https://github.com/owner/repo/tree/v1"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs focus:border-ops-accent focus:outline-none"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="font-medium">{t("subdir")}</span>
          <input
            name="subdir"
            placeholder="themes/my-theme"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs focus:border-ops-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="font-medium">{t("ref")}</span>
          <input
            name="ref"
            placeholder="v1 or main"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs focus:border-ops-accent focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="font-medium">{t("internalNotes")}</span>
        <input
          name="notes"
          placeholder={t("notesPlaceholder")}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-xs focus:border-ops-accent focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="font-medium">{t("status")}</span>
        <select
          name="status"
          defaultValue="listed"
          className="mt-1 rounded border border-slate-300 bg-white px-2 py-1.5"
        >
          <option value="listed">{t("listedVisible")}</option>
          <option value="pending">{t("pending")}</option>
          <option value="hidden">{t("hidden")}</option>
        </select>
      </label>
      <p className="text-xs text-slate-400">{t("listingHint")}</p>
      <FormError error={state.error} />
      {state.saved && (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">{t("listedAs", { name: state.name ?? "" })}</p>
      )}
      <button
        type="submit"
        className="rounded bg-ops-accent px-4 py-2 font-medium text-white hover:bg-teal-800"
      >
        {t("fetchAdd")}
      </button>
    </form>
  );
}
