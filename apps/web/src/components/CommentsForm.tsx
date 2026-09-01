"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
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
import { useFormErrorText } from "@/components/FormError";
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
  const t = useTranslations("comments");
  const tc = useTranslations("common");
  const errorText = useFormErrorText();
  if (state.error) {
    return (
      <p className="rounded bg-red-50 p-3 text-red-600">
        {errorText(state.error)}
        {state.reviewUrl ? (
          <>
            {" "}
            <a href={state.reviewUrl} className="underline hover:text-red-800">
              {t("reviewGithub")}
            </a>
          </>
        ) : null}
      </p>
    );
  }
  if (state.saved) {
    return <p className="rounded bg-emerald-50 p-3 text-emerald-700">{tc("savedRebuild")}</p>;
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
  const t = useTranslations("comments");
  const tc = useTranslations("common");
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
        {t.rich("lead", {
          strong: (chunks) => <strong className="font-medium text-neutral-800">{chunks}</strong>,
        })}
      </p>

      {needsDiscussionsPermission ? (
        <p className="rounded bg-amber-50 p-3 text-amber-900">
          {t("needDiscussions")}
          {reviewUrl ? (
            <>
              <a href={reviewUrl} className="mx-1 underline hover:text-amber-950">
                {t("reviewGithub")}
              </a>
              {t("reviewThen")}
            </>
          ) : (
            <> {t("reviewInPage")}</>
          )}
        </p>
      ) : null}

      {connected && giscusAppInstalled === false ? (
        <p className="rounded bg-amber-50 p-3 text-amber-900">
          {t.rich("appMissing", {
            strong: (chunks) => <strong className="font-medium">{chunks}</strong>,
          })}
        </p>
      ) : null}

      <StatusMessage state={connectState} />
      <StatusMessage state={toggleState} />
      <StatusMessage state={disconnectState} />
      <StatusMessage state={snippetState} />

      <ol className="space-y-3">
        <li className="rounded border border-neutral-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-neutral-800">{t("step1")}</p>
            <StepBadge
              ok={giscusAppInstalled}
              okLabel={t("installed")}
              badLabel={t("notInstalled")}
              unknownLabel={t("undetected")}
            />
          </div>
          <p className="mt-2 text-neutral-600">
            {t.rich("step1Body", {
              repo: () => (
                <a
                  href={`https://github.com/${siteRepo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-wp-accent hover:underline"
                >
                  {siteRepo}
                </a>
              ),
            })}
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
              {giscusAppInstalled === true ? t("manageGiscus") : t("installGiscus")}
            </a>
            <form action={recheckGiscusAction}>
              <input type="hidden" name="siteId" value={siteId} />
              <ProgressButton
                expectedSeconds={2}
                pendingLabel={t("checking")}
                className="text-wp-accent hover:underline"
              >
                {t("recheck")}
              </ProgressButton>
            </form>
          </div>
        </li>

        <li className="rounded border border-neutral-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-neutral-800">{t("step2")}</p>
            <StepBadge
              ok={connected}
              okLabel={giscus ? `${giscus.repo} · ${giscus.category}` : t("connected")}
              badLabel={t("notConnected")}
              unknownLabel={t("notConnected")}
            />
          </div>
          <p className="mt-2 text-neutral-600">{t("step2Body")}</p>
          {connected ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href={`https://github.com/${siteRepo}/discussions`}
                target="_blank"
                rel="noreferrer"
                className="text-wp-accent hover:underline"
              >
                {t("viewComments")}
              </a>
              <form action={disconnectAction}>
                <input type="hidden" name="siteId" value={siteId} />
                <ProgressButton
                  expectedSeconds={4}
                  pendingLabel={t("disconnecting")}
                  buildSiteId={siteId}
                  className="rounded border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-50"
                >
                  {t("disconnect")}
                </ProgressButton>
              </form>
            </div>
          ) : (
            <form action={connectAction} className="mt-3 space-y-2">
              <input type="hidden" name="siteId" value={siteId} />
              <ProgressButton
                expectedSeconds={8}
                pendingLabel={t("connecting")}
                buildSiteId={siteId}
                className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
              >
                {t("connectWrite")}
              </ProgressButton>
              {giscusAppInstalled === false ? (
                <p className="text-xs text-amber-800">{t("connectEarly")}</p>
              ) : null}
            </form>
          )}
        </li>

        {connected || snippet ? (
          <li className="rounded border border-neutral-200 p-4">
            <p className="font-medium text-neutral-800">{t("step3")}</p>
            <p className="mt-2 text-neutral-600">{t("step3Body")}</p>
            <form action={toggleAction} className="mt-3 flex items-center justify-between gap-4">
              <input type="hidden" name="siteId" value={siteId} />
              <input type="hidden" name="enabled" value={on ? "false" : "true"} />
              <span>{on ? t("currentlyOn") : t("currentlyOff")}</span>
              <ProgressButton
                expectedSeconds={4}
                pendingLabel={tc("saving")}
                buildSiteId={siteId}
                className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
              >
                {on ? t("turnOff") : t("turnOn")}
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
            pendingLabel={t("triggering")}
            buildSiteId={siteId}
            className="rounded border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-50"
          >
            {t("rebuild")}
          </ProgressButton>
          <span className="text-xs text-neutral-400">{t("rebuildHint")}</span>
        </form>
      ) : null}

      {snippet && !connected ? <p className="text-neutral-600">{t("usingSnippet")}</p> : null}

      {connected ? null : (
        <details className="rounded border border-neutral-200 p-3">
          <summary className="cursor-pointer font-medium">{t("advanced")}</summary>
          <form action={snippetAction} className="mt-3 space-y-3">
            <input type="hidden" name="siteId" value={siteId} />
            <textarea
              name="commentsSnippet"
              rows={6}
              defaultValue={snippet}
              placeholder={t("snippetPlaceholder")}
              className="w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
            />
            <p className="text-xs text-neutral-400">{t("snippetHint")}</p>
            <ProgressButton
              expectedSeconds={4}
              pendingLabel={tc("saving")}
              buildSiteId={siteId}
              className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
            >
              {t("saveSnippet")}
            </ProgressButton>
          </form>
        </details>
      )}
    </div>
  );
}
