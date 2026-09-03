"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { disconnectSiteAction, type DisconnectSiteState } from "@/lib/actions";
import { FormError } from "@/components/FormError";
import { ProgressButton } from "@/components/ProgressButton";

interface Props {
  siteId: string;
  siteName: string;
  slug: string;
}

export function DisconnectSiteForm({ siteId, siteName, slug }: Props) {
  const t = useTranslations("disconnect");
  const [state, formAction] = useActionState<DisconnectSiteState, FormData>(disconnectSiteAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="siteId" value={siteId} />
      <label className="block text-sm">
        <span className="font-medium">{t("confirmLabel")}</span>
        <input
          name="confirmName"
          required
          autoComplete="off"
          placeholder={siteName}
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 font-mono text-sm"
        />
        <span className="mt-1 block text-xs text-neutral-500">{t("confirmHint", { name: siteName, slug })}</span>
      </label>
      <FormError error={state.error} />
      <ProgressButton
        expectedSeconds={3}
        pendingLabel={t("submitting")}
        className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
      >
        {t("submit")}
      </ProgressButton>
    </form>
  );
}
