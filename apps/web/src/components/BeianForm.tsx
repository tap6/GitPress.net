"use client";

import { useActionState } from "react";
import { ProgressButton } from "@/components/ProgressButton";
import { saveBeianAction, type SaveBeianState } from "@/lib/actions";
import type { SiteBeian } from "@/lib/footer";

interface Props {
  siteId: string;
  initial: SiteBeian;
}

export function BeianForm({ siteId, initial }: Props) {
  const [state, formAction] = useActionState<SaveBeianState, FormData>(saveBeianAction, {});

  return (
    <form action={formAction} className="space-y-4 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <p className="text-xs text-neutral-400">
        中国大陆站点如需公示备案号请填写。海外站点留空即可。填了会出现在页脚最末,换主题不会丢。
      </p>
      <label className="block">
        <span className="font-medium">ICP 备案号</span>
        <input
          name="icp"
          defaultValue={initial.icp ?? ""}
          placeholder="京ICP备12345678号"
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
        />
        <span className="mt-1 block text-xs text-neutral-400">
          链到工信部备案查询(beian.miit.gov.cn)。
        </span>
      </label>
      <label className="block">
        <span className="font-medium">公安备案号</span>
        <input
          name="gongan"
          defaultValue={initial.gongan ?? ""}
          placeholder="11000002000001 或 京公网安备 11000002000001号"
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
        />
        <span className="mt-1 block text-xs text-neutral-400">
          可只填数字,或粘贴完整「X公网安备 …号」。页脚会显示官方网安徽章并链到公安查询页。
        </span>
      </label>
      {state.error && <p className="rounded bg-red-50 p-3 text-red-600">{state.error}</p>}
      {state.saved && (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">已保存,站点将在约 1 分钟后更新。</p>
      )}
      <ProgressButton
        expectedSeconds={4}
        pendingLabel="保存中"
        buildSiteId={siteId}
        className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
      >
        保存备案信息
      </ProgressButton>
    </form>
  );
}
