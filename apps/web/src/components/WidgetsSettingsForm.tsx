"use client";

import { useTranslations } from "next-intl";
import { setScratchNoteEnabledAction } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";

export function WidgetsSettingsForm({
  siteId,
  scratchEnabled,
}: {
  siteId: string;
  scratchEnabled: boolean;
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");

  return (
    <form action={setScratchNoteEnabledAction} className="space-y-4 p-5">
      <input type="hidden" name="siteId" value={siteId} />
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="enabled"
          value="on"
          defaultChecked={scratchEnabled}
          className="mt-0.5 accent-wp-accent"
        />
        <span>
          <span className="font-medium text-neutral-800">{t("scratch")}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{t("scratchHint")}</span>
        </span>
      </label>
      <ProgressButton
        expectedSeconds={2}
        pendingLabel={tc("saving")}
        className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
      >
        {tc("save")}
      </ProgressButton>
    </form>
  );
}
