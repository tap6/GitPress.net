"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { ImageCropper } from "@/components/ImageCropper";
import { ProgressButton } from "@/components/ProgressButton";
import { FormError } from "@/components/FormError";
import { saveBrandAction, type SaveBrandState } from "@/lib/actions";
import { mediaPreviewUrl } from "@/lib/mediaUrl";

interface Props {
  siteId: string;
  logo?: string;
  avatar?: string;
}

function previewFor(siteId: string, path?: string): string | null {
  if (!path) return null;
  if (path.startsWith("/media/")) return mediaPreviewUrl(siteId, path.slice("/media/".length));
  if (path.startsWith("media/")) return mediaPreviewUrl(siteId, path.slice("media/".length));
  return null;
}

export function BrandMediaForm({ siteId, logo, avatar }: Props) {
  const t = useTranslations("media");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<SaveBrandState, FormData>(saveBrandAction, {});

  return (
    <form action={formAction} className="space-y-8 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <ImageCropper
        label={t("logo")}
        hint={t("logoHint")}
        aspect={2}
        dataField="logoDataUrl"
        removeField="removeLogo"
        currentPreviewUrl={previewFor(siteId, logo)}
        aspectChoices={[
          { id: "wide", label: t("aspectWide"), value: 2 },
          { id: "square", label: t("aspectSquare"), value: 1 },
          { id: "banner", label: t("aspectBanner"), value: 3 },
        ]}
      />
      <ImageCropper
        label={t("avatar")}
        hint={t("avatarHint")}
        aspect={1}
        round
        dataField="avatarDataUrl"
        removeField="removeAvatar"
        currentPreviewUrl={previewFor(siteId, avatar)}
      />
      <FormError error={state.error} />
      {state.saved && (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">{tc("savedRebuild")}</p>
      )}
      <ProgressButton
        expectedSeconds={6}
        pendingLabel={tc("saving")}
        buildSiteId={siteId}
        className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
      >
        {t("saveBrand")}
      </ProgressButton>
    </form>
  );
}
