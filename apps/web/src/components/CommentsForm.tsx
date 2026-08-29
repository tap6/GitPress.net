"use client";

import { useActionState } from "react";
import {
  connectGiscusAction,
  disconnectGiscusAction,
  saveCommentsAction,
  setCommentsEnabledAction,
  type SaveCommentsState,
} from "@/lib/actions";
import { commentsEnabled, type GiscusConfig } from "@/lib/comments";
import { ProgressButton } from "@/components/ProgressButton";

interface Props {
  siteId: string;
  siteRepo: string;
  giscus?: GiscusConfig;
  enabled?: boolean;
  snippet: string;
  reviewUrl?: string;
  needsDiscussionsPermission?: boolean;
}

function StatusMessage({ state }: { state: SaveCommentsState }) {
  if (state.error) {
    return (
      <p className="rounded bg-red-50 p-3 text-red-600">
        {state.error}
        {state.reviewUrl ? (
          <>
            {" "}
            <a href={state.reviewUrl} className="underline hover:text-red-800">
              前往 GitHub 批准
            </a>
          </>
        ) : null}
      </p>
    );
  }
  if (state.saved) {
    return <p className="rounded bg-emerald-50 p-3 text-emerald-700">已保存,站点将在约 1 分钟后更新。</p>;
  }
  return null;
}

export function CommentsForm({
  siteId,
  siteRepo,
  giscus,
  enabled,
  snippet,
  reviewUrl,
  needsDiscussionsPermission,
}: Props) {
  const connected = Boolean(giscus);
  const on = commentsEnabled({ enabled, giscus }, snippet);
  const [connectState, connectAction] = useActionState<SaveCommentsState, FormData>(
    connectGiscusAction,
    {},
  );
  const [toggleState, toggleAction] = useActionState<SaveCommentsState, FormData>(
    setCommentsEnabledAction,
    {},
  );
  const [disconnectState, disconnectAction] = useActionState<SaveCommentsState, FormData>(
    disconnectGiscusAction,
    {},
  );
  const [snippetState, snippetAction] = useActionState<SaveCommentsState, FormData>(
    saveCommentsAction,
    {},
  );

  return (
    <div className="space-y-4 p-5 text-sm">
      {needsDiscussionsPermission ? (
        <p className="rounded bg-amber-50 p-3 text-amber-900">
          连接 giscus 需要 GitPress App 的 Discussions 权限。请先
          {reviewUrl ? (
            <>
              <a href={reviewUrl} className="mx-1 underline hover:text-amber-950">
                前往 GitHub 批准
              </a>
              后再点连接。
            </>
          ) : (
            " 到设置页的 GitHub App 一节批准新权限。"
          )}
        </p>
      ) : null}

      {connected && giscus ? (
        <p className="text-neutral-600">
          已连接{" "}
          <span className="font-medium text-neutral-800">
            {giscus.repo} · {giscus.category}
          </span>
          。评论存在站点仓库的 GitHub Discussions 里。
        </p>
      ) : snippet ? (
        <p className="text-neutral-600">当前使用自定义嵌入代码。也可以一键改连 giscus。</p>
      ) : (
        <p className="text-neutral-600">
          用 giscus 在文章页挂评论,数据存在公开站点仓库的 Discussions。GitPress 会打开 Discussions
          并填好仓库信息;你还需要在 GitHub 安装 giscus App。
        </p>
      )}

      <StatusMessage state={connectState} />
      <StatusMessage state={toggleState} />
      <StatusMessage state={disconnectState} />
      <StatusMessage state={snippetState} />

      {connected || snippet ? (
        <form action={toggleAction} className="flex items-center justify-between gap-4">
          <input type="hidden" name="siteId" value={siteId} />
          <input type="hidden" name="enabled" value={on ? "false" : "true"} />
          <span className="font-medium">显示评论区</span>
          <ProgressButton
            expectedSeconds={4}
            pendingLabel="保存中"
            buildSiteId={siteId}
            className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
          >
            {on ? "关闭" : "开启"}
          </ProgressButton>
        </form>
      ) : null}

      {connected ? (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`https://github.com/${siteRepo}/discussions`}
            target="_blank"
            rel="noreferrer"
            className="text-wp-accent hover:underline"
          >
            在 GitHub 查看评论
          </a>
          <form action={disconnectAction}>
            <input type="hidden" name="siteId" value={siteId} />
            <ProgressButton
              expectedSeconds={4}
              pendingLabel="断开中"
              buildSiteId={siteId}
              className="rounded border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-50"
            >
              断开 giscus
            </ProgressButton>
          </form>
        </div>
      ) : (
        <form action={connectAction} className="space-y-2">
          <input type="hidden" name="siteId" value={siteId} />
          <ProgressButton
            expectedSeconds={8}
            pendingLabel="连接中"
            buildSiteId={siteId}
            className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
          >
            一键连接 giscus
          </ProgressButton>
          <p className="text-xs text-neutral-400">
            连接后请前往{" "}
            <a
              href="https://github.com/apps/giscus"
              target="_blank"
              rel="noreferrer"
              className="text-wp-accent hover:underline"
            >
              安装 giscus App
            </a>
            ，并授权给公开仓库{" "}
            <a
              href={`https://github.com/${siteRepo}`}
              target="_blank"
              rel="noreferrer"
              className="text-wp-accent hover:underline"
            >
              {siteRepo}
            </a>
            。装好之前访客还不能发言。
          </p>
        </form>
      )}

      {connected ? null : (
        <details className="rounded border border-neutral-200 p-3">
          <summary className="cursor-pointer font-medium">高级:自定义嵌入代码</summary>
          <form action={snippetAction} className="mt-3 space-y-3">
            <input type="hidden" name="siteId" value={siteId} />
            <textarea
              name="commentsSnippet"
              rows={6}
              defaultValue={snippet}
              placeholder="粘贴 giscus / utterances / Disqus 等完整 <script> 代码"
              className="w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
            />
            <p className="text-xs text-neutral-400">
              不会走 giscus 一键连接时使用。保存后可用上方开关关闭,不必删掉这段代码。
            </p>
            <ProgressButton
              expectedSeconds={4}
              pendingLabel="保存中"
              buildSiteId={siteId}
              className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
            >
              保存嵌入代码
            </ProgressButton>
          </form>
        </details>
      )}
    </div>
  );
}
