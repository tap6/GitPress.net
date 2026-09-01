"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { ProgressButton } from "@/components/ProgressButton";
import { FormError } from "@/components/FormError";
import { saveBeianAction, type SaveBeianState } from "@/lib/actions";
import type { SiteBeian } from "@/lib/footer";

interface Props {
  siteId: string;
  initial: SiteBeian;
}

export function BeianForm({ siteId, initial }: Props) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<SaveBeianState, FormData>(saveBeianAction, {});

  return (
    <form action={formAction} className="space-y-4 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <p className="text-xs text-neutral-400">{t("beianLead")}</p>
      <label className="block">
        <span className="font-medium">{t("icp")}</span>
        <input
          name="icp"
          defaultValue={initial.icp ?? ""}
          placeholder={t("icpPlaceholder")}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
        />
        <span className="mt-1 block text-xs text-neutral-400">{t("icpHint")}</span>
      </label>
      <label className="block">
        <span className="font-medium">{t("gongan")}</span>
        <input
          name="gongan"
          defaultValue={initial.gongan ?? ""}
          placeholder="11000002000001"
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
        />
        <span className="mt-1 block text-xs text-neutral-400">{t("gonganHint")}</span>
      </label>
      <FormError error={state.error} />
      {state.saved && (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">{tc("savedRebuild")}</p>
      )}
      <ProgressButton
        expectedSeconds={4}
        pendingLabel={tc("saving")}
        buildSiteId={siteId}
        className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
      >
        {t("saveBeian")}
      </ProgressButton>
    </form>
  );
}
