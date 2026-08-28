"use client";

import { useActionState } from "react";
import { ImageCropper } from "@/components/ImageCropper";
import { ProgressButton } from "@/components/ProgressButton";
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
  const [state, formAction] = useActionState<SaveBrandState, FormData>(saveBrandAction, {});

  return (
    <form action={formAction} className="space-y-8 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <ImageCropper
        label="站点 Logo"
        hint="会出现在页头；主题选项里可以关掉。建议透明底或浅色底的 PNG/JPG。"
        aspect={2}
        dataField="logoDataUrl"
        removeField="removeLogo"
        currentPreviewUrl={previewFor(siteId, logo)}
        aspectChoices={[
          { id: "wide", label: "宽 2:1", value: 2 },
          { id: "square", label: "方 1:1", value: 1 },
          { id: "banner", label: "横 3:1", value: 3 },
        ]}
      />
      <ImageCropper
        label="头像"
        hint="圆形头像。默认不显示,在「外观」里打开「显示头像」后才会出现在主题页头。"
        aspect={1}
        round
        dataField="avatarDataUrl"
        removeField="removeAvatar"
        currentPreviewUrl={previewFor(siteId, avatar)}
      />
      {state.error && <p className="rounded bg-red-50 p-3 text-red-600">{state.error}</p>}
      {state.saved && (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">
          已保存,站点将在约 1 分钟后更新。
        </p>
      )}
      <ProgressButton
        expectedSeconds={6}
        pendingLabel="保存中"
        buildSiteId={siteId}
        className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
      >
        保存 Logo / 头像
      </ProgressButton>
    </form>
  );
}
