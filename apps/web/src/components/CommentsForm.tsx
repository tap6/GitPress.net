"use client";

import { useActionState } from "react";
import { saveCommentsAction, type SaveCommentsState } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";

interface Props {
  siteId: string;
  siteRepo: string;
  initial: string;
}

export function CommentsForm({ siteId, siteRepo, initial }: Props) {
  const [state, formAction] = useActionState<SaveCommentsState, FormData>(saveCommentsAction, {});

  return (
    <form action={formAction} className="space-y-4 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <label className="block">
        <span className="font-medium">评论嵌入代码(可选)</span>
        <textarea
          name="commentsSnippet"
          rows={6}
          defaultValue={initial}
          placeholder={'前往 giscus.app 生成,粘贴完整 <script> 代码'}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
        />
        <span className="mt-1 block text-xs text-neutral-400">
          推荐{" "}
          <a href="https://giscus.app" target="_blank" rel="noreferrer" className="text-wp-accent hover:underline">
            giscus
          </a>
          (基于 GitHub Discussions)。先在公开站点仓库{" "}
          <a
            href={`https://github.com/${siteRepo}`}
            target="_blank"
            rel="noreferrer"
            className="text-wp-accent hover:underline"
          >
            {siteRepo}
          </a>{" "}
          开启 Discussions,再把生成的脚本贴到这里。留空则不显示评论区。
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
        保存更改
      </ProgressButton>
    </form>
  );
}
