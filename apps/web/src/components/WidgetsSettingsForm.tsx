"use client";

import { setScratchNoteEnabledAction } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";

export function WidgetsSettingsForm({
  siteId,
  scratchEnabled,
}: {
  siteId: string;
  scratchEnabled: boolean;
}) {
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
          <span className="font-medium text-neutral-800">随手记</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
            显示在仪表盘顶部,用来记待办或提纲。正文存在 GitPress 控制面,不写入你的文章仓库,保存也不会触发构建。关掉后正文仍保留,再打开还能看到。
          </span>
        </span>
      </label>
      <ProgressButton
        expectedSeconds={2}
        pendingLabel="保存中"
        className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
      >
        保存
      </ProgressButton>
    </form>
  );
}
