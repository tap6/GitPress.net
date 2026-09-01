"use client";

import { Link } from "@/i18n/navigation";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  saveSiteUrlAction,
  unregisterPagesDomainAction,
  type SaveSiteUrlState,
} from "@/lib/actions";
import { FormError } from "@/components/FormError";
import { ProgressButton } from "@/components/ProgressButton";
import {
  Callout,
  DnsTable,
  HostingOptionButtons,
  HostingSteps,
  type HostingKind,
} from "@/components/HostingGuide";
import { dnsRecordsForDomain, githubPagesHost, pagesCertificateKind } from "@/lib/customDomain";

interface Props {
  siteId: string;
  siteRepo: string;
  currentUrl: string | null;
  defaultUrl: string;
  pagesCname: string | null;
  certificateState: string | null;
  defaultRegisterPages: boolean;
  notice?: "url" | "pages" | "unpages" | "reset" | null;
}

function initialHost(defaultRegisterPages: boolean, pagesCname: string | null): HostingKind {
  if (pagesCname || defaultRegisterPages) return "pages";
  return "other";
}

export function SiteUrlForm({
  siteId,
  siteRepo,
  currentUrl,
  defaultUrl,
  pagesCname,
  certificateState,
  defaultRegisterPages,
  notice = null,
}: Props) {
  const t = useTranslations("hosting");
  const [saveState, saveAction] = useActionState<SaveSiteUrlState, FormData>(saveSiteUrlAction, {});
  const [unpagesState, unpagesAction] = useActionState<SaveSiteUrlState, FormData>(
    unregisterPagesDomainAction,
    {},
  );
  const [host, setHost] = useState<HostingKind>(() => initialHost(defaultRegisterPages, pagesCname));

  const pagesHost = githubPagesHost(siteRepo);
  const records = pagesCname ? dnsRecordsForDomain(pagesCname, pagesHost) : [];
  const certKind = pagesCertificateKind(certificateState);
  const certNote =
    certKind === "ready"
      ? t("certReady")
      : certKind === "error"
        ? t("certError")
        : certKind === "pending"
          ? t("certPending")
          : null;
  const error = saveState.error ?? unpagesState.error;
  const registerPages = host === "pages";
  const pagesDns = records.length > 0 ? <DnsTable rows={records} /> : undefined;

  return (
    <div className="space-y-4 p-5 text-sm leading-relaxed text-neutral-600">
      <Callout tone="amber" title={t("fillVisitorUrl")}>
        {t.rich("fillVisitorUrlBody", {
          help: (chunks) => (
            <Link
              href="/help/custom-domain"
              className="ml-1 font-medium text-amber-800 underline hover:text-amber-950"
            >
              {chunks}
            </Link>
          ),
        })}
      </Callout>

      <div>
        <p className="mb-2 font-medium text-neutral-800">{t("whichHost")}</p>
        <HostingOptionButtons value={host} onChange={setHost} />
        <p className="mt-2 text-xs text-neutral-400">{t("whichHostHint")}</p>
      </div>

      {host !== "pages" && pagesCname ? (
        <Callout tone="rose" title={t("stillOnPages")}>
          {t("stillOnPagesBody")}
        </Callout>
      ) : null}

      <form action={saveAction} className="space-y-3">
        <input type="hidden" name="siteId" value={siteId} />
        {registerPages ? <input type="hidden" name="registerPages" value="on" /> : null}
        <label className="block">
          <span className="font-medium text-neutral-800">{t("visitorUrl")}</span>
          <input
            name="origin"
            defaultValue={currentUrl ?? defaultUrl}
            placeholder={defaultUrl}
            autoComplete="off"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-wp-accent focus:outline-none"
          />
          <span className="mt-1 block text-xs text-neutral-400">
            {t.rich("visitorUrlHint", {
              apex: (chunks) => <code className="font-mono">{chunks}</code>,
              sub: (chunks) => <code className="font-mono">{chunks}</code>,
              def: () => <code className="break-all font-mono">{defaultUrl}</code>,
            })}
          </span>
        </label>
        <FormError error={error} />
        {notice === "url" && <p className="rounded bg-emerald-50 p-3 text-emerald-700">{t("noticeUrl")}</p>}
        {notice === "pages" && (
          <p className="rounded bg-emerald-50 p-3 text-emerald-700">{t("noticePages")}</p>
        )}
        {notice === "reset" && (
          <p className="rounded bg-emerald-50 p-3 text-emerald-700">{t("noticeReset", { url: defaultUrl })}</p>
        )}
        {notice === "unpages" && (
          <p className="rounded bg-emerald-50 p-3 text-emerald-700">{t("noticeUnpages")}</p>
        )}
        <ProgressButton
          expectedSeconds={6}
          pendingLabel={t("saving")}
          buildSiteId={siteId}
          className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
        >
          {t("saveUrl")}
        </ProgressButton>
      </form>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
        <HostingSteps host={host} variant="settings" siteRepo={siteRepo} pagesDns={pagesDns} />
      </div>

      {pagesCname && (
        <div className="space-y-3 border-t border-neutral-100 pt-4">
          <p className="font-medium text-neutral-800">{t("pagesRegistered", { domain: pagesCname })}</p>
          {certNote && <p className="text-xs text-neutral-500">{certNote}</p>}
          <form action={unpagesAction}>
            <input type="hidden" name="siteId" value={siteId} />
            <ProgressButton
              expectedSeconds={5}
              pendingLabel={t("unregistering")}
              className="rounded border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-50"
            >
              {t("unregisterPages")}
            </ProgressButton>
          </form>
        </div>
      )}
    </div>
  );
}
