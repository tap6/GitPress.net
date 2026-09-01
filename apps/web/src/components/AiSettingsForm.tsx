"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { clearAiSettingsAction, saveAiSettingsAction, type SaveAiSettingsState } from "@/lib/actions";
import { FormError } from "@/components/FormError";

interface Props {
  hasExisting: boolean;
  initial: { baseUrl: string; model: string };
  /** When true, skip the outer card — parent already provides a panel. */
  embedded?: boolean;
}

export function AiSettingsForm({ hasExisting, initial, embedded = false }: Props) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<SaveAiSettingsState, FormData>(
    saveAiSettingsAction,
    {},
  );

  return (
    <div className="space-y-4">
      <form
        action={formAction}
        className={
          embedded
            ? "space-y-4 text-sm"
            : "space-y-4 rounded border border-neutral-200 bg-white p-5 text-sm shadow-sm"
        }
      >
        <label className="block">
          <span className="font-medium">Base URL</span>
          <input
            name="baseUrl"
            required
            defaultValue={initial.baseUrl}
            placeholder="https://api.openai.com/v1"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
          />
          <span className="mt-1 block text-xs text-neutral-400">{t("aiBaseHint")}</span>
        </label>
        <label className="block">
          <span className="font-medium">{t("aiModel")}</span>
          <input
            name="model"
            required
            defaultValue={initial.model}
            placeholder="gpt-4o-mini"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="font-medium">API Key</span>
          <input
            name="apiKey"
            type="password"
            autoComplete="off"
            placeholder={hasExisting ? t("aiKeyKeep") : "sk-..."}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
          />
          <span className="mt-1 block text-xs text-neutral-400">{t("aiKeyHint")}</span>
        </label>

        <FormError error={state.error} />
        {state.saved && <p className="rounded bg-emerald-50 p-3 text-emerald-700">{t("aiSaved")}</p>}

        <button
          type="submit"
          className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
        >
          {tc("save")}
        </button>
      </form>

      {hasExisting && (
        <form action={clearAiSettingsAction}>
          <button type="submit" className="text-xs text-neutral-400 hover:text-red-600">
            {t("aiClear")}
          </button>
        </form>
      )}
    </div>
  );
}
