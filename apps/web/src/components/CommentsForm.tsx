"use client";

import { useActionState } from "react";
import {
  connectGiscusAction,
  disconnectGiscusAction,
  rebuildAction,
  recheckGiscusAction,
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
  giscusAppInstalled: boolean | null;
  giscusInstallUrl: string;
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

function StepBadge({
  ok,
  okLabel,
  badLabel,
  unknownLabel,
}: {
  ok: boolean | null;
  okLabel: string;
  badLabel: string;
  unknownLabel: string;
}) {
  if (ok === true) {
    return <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{okLabel}</span>;
  }
  if (ok === false) {
    return <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">{badLabel}</span>;
  }
  return <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">{unknownLabel}</span>;
}

export function CommentsForm({
  siteId,
  siteRepo,
  giscus,
  enabled,
  snippet,
  reviewUrl,
  needsDiscussionsPermission,
  giscusAppInstalled,
  giscusInstallUrl,
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
      <p className="text-neutral-600">
        评论要两步，<strong className="font-medium text-neutral-800">先装 giscus App 再连接</strong>
        最稳妥，顺序反了也可以。装 App 不用重建；连接配置会自动触发构建。
      </p>

      {needsDiscussionsPermission ? (
        <p className="rounded bg-amber-50 p-3 text-amber-900">
          连接需要 GitPress App 的 Discussions 权限。请先
          {reviewUrl ? (
            <>
              <a href={reviewUrl} className="mx-1 underline hover:text-amber-950">
                前往 GitHub 批准
              </a>
              后再点步骤 2。
            </>
          ) : (
            " 到本页「故障排查 · GitHub App」批准新权限。"
          )}
        </p>
      ) : null}

      {connected && giscusAppInstalled === false ? (
        <p className="rounded bg-amber-50 p-3 text-amber-900">
          配置已经写入，但这个仓库还没装 giscus App。现在打开文章会看到
          “giscus is not installed on this repository”。请先完成步骤 1，然后
          <strong className="font-medium">刷新文章页即可，不必再构建</strong>。
        </p>
      ) : null}

      <StatusMessage state={connectState} />
      <StatusMessage state={toggleState} />
      <StatusMessage state={disconnectState} />
      <StatusMessage state={snippetState} />

      <ol className="space-y-3">
        <li className="rounded border border-neutral-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-neutral-800">1. 安装 giscus App</p>
            <StepBadge
              ok={giscusAppInstalled}
              okLabel="已安装"
              badLabel="未安装"
              unknownLabel="未能检测"
            />
          </div>
          <p className="mt-2 text-neutral-600">
            把 giscus 授权给公开仓库{" "}
            <a
              href={`https://github.com/${siteRepo}`}
              target="_blank"
              rel="noreferrer"
              className="text-wp-accent hover:underline"
            >
              {siteRepo}
            </a>
            。不装的话访客只能看到报错，评论发不出去。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={giscusInstallUrl}
              target="_blank"
              rel="noreferrer"
              className={`inline-block rounded px-4 py-2 font-medium ${
                giscusAppInstalled === true
                  ? "border border-neutral-300 hover:bg-neutral-50"
                  : "bg-wp-accent text-white hover:bg-wp-accent-dark"
              }`}
            >
              {giscusAppInstalled === true ? "管理 giscus 安装" : "去 GitHub 安装 giscus"}
            </a>
            <form action={recheckGiscusAction}>
              <input type="hidden" name="siteId" value={siteId} />
              <ProgressButton
                expectedSeconds={2}
                pendingLabel="检测中"
                className="text-wp-accent hover:underline"
              >
                我已安装，重新检测
              </ProgressButton>
            </form>
          </div>
        </li>

        <li className="rounded border border-neutral-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-neutral-800">2. 连接本站</p>
            <StepBadge
              ok={connected}
              okLabel={giscus ? `${giscus.repo} · ${giscus.category}` : "已连接"}
              badLabel="未连接"
              unknownLabel="未连接"
            />
          </div>
          <p className="mt-2 text-neutral-600">
            GitPress 会打开 Discussions，并写入仓库 / 分类 ID。保存后会自动排队构建，文章页才会出现评论框。
          </p>
          {connected ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
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
                  断开连接
                </ProgressButton>
              </form>
            </div>
          ) : (
            <form action={connectAction} className="mt-3 space-y-2">
              <input type="hidden" name="siteId" value={siteId} />
              <ProgressButton
                expectedSeconds={8}
                pendingLabel="连接中"
                buildSiteId={siteId}
                className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
              >
                连接并写入配置
              </ProgressButton>
              {giscusAppInstalled === false ? (
                <p className="text-xs text-amber-800">
                  现在连接也可以，但构建完成后文章页仍会报未安装。建议先做完步骤 1。
                </p>
              ) : null}
            </form>
          )}
        </li>

        {connected || snippet ? (
          <li className="rounded border border-neutral-200 p-4">
            <p className="font-medium text-neutral-800">3. 显示评论区</p>
            <p className="mt-2 text-neutral-600">关掉只是不渲染，配置还在，不必删掉重来。</p>
            <form action={toggleAction} className="mt-3 flex items-center justify-between gap-4">
              <input type="hidden" name="siteId" value={siteId} />
              <input type="hidden" name="enabled" value={on ? "false" : "true"} />
              <span>当前：{on ? "已开启" : "已关闭"}</span>
              <ProgressButton
                expectedSeconds={4}
                pendingLabel="保存中"
                buildSiteId={siteId}
                className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
              >
                {on ? "关闭" : "开启"}
              </ProgressButton>
            </form>
          </li>
        ) : null}
      </ol>

      {connected ? (
        <form action={rebuildAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="siteId" value={siteId} />
          <ProgressButton
            expectedSeconds={5}
            pendingLabel="触发中"
            buildSiteId={siteId}
            className="rounded border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-50"
          >
            手动触发重新构建
          </ProgressButton>
          <span className="text-xs text-neutral-400">
            只装 App 不用点这个。评论框还没出现时再构建一次。
          </span>
        </form>
      ) : null}

      {snippet && !connected ? (
        <p className="text-neutral-600">当前使用自定义嵌入代码。也可以按上面两步改连 giscus。</p>
      ) : null}

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
              不会走上面两步时使用。保存后可用「显示评论区」关掉，不必删掉这段代码。
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
