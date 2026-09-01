"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProgressButton } from "@/components/ProgressButton";
import { FormError } from "@/components/FormError";
import { importThemeAction, type ImportThemeState } from "@/lib/actions";

export function ThemeImportForm({ siteId }: { siteId: string }) {
  const t = useTranslations("appearance");
  const router = useRouter();
  const [state, formAction] = useActionState<ImportThemeState, FormData>(importThemeAction, {});

  useEffect(() => {
    if (state.saved) router.refresh();
  }, [state.saved, router]);

  return (
    <form action={formAction} className="space-y-3 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor="theme-import-repo" className="font-medium">
            {t("repo")}
          </label>
          <Link
            href="/help/import-theme"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-wp-accent hover:underline"
          >
            {t("howImport")}
          </Link>
        </div>
        <input
          id="theme-import-repo"
          name="repo"
          required
          placeholder="owner/repo or https://github.com/owner/repo/tree/main/themes/my-theme"
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="font-medium">{t("subdir")}</span>
          <input
            name="subdir"
            placeholder="themes/my-theme"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="font-medium">{t("ref")}</span>
          <input
            name="ref"
            placeholder="v1 or main"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
          />
        </label>
      </div>
      <p className="text-xs text-neutral-400">
        {t("importHint")}{" "}
        <Link href="/help/import-theme" target="_blank" rel="noreferrer" className="text-wp-accent hover:underline">
          {t("details")}
        </Link>
      </p>
      <FormError error={state.error} />
      {state.saved && (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">{t("added", { name: state.name ?? "" })}</p>
      )}
      <ProgressButton
        expectedSeconds={4}
        pendingLabel={t("adding")}
        className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
      >
        {t("addMine")}
      </ProgressButton>
    </form>
  );
}
