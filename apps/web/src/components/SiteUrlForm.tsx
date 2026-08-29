"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  saveSiteUrlAction,
  unregisterPagesDomainAction,
  type SaveSiteUrlState,
} from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import {
  Callout,
  DnsTable,
  HostingOptionButtons,
  HostingSteps,
  type HostingKind,
} from "@/components/HostingGuide";
import {
  describePagesCertificate,
  dnsRecordsForDomain,
  githubPagesHost,
} from "@/lib/customDomain";

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
  const [saveState, saveAction] = useActionState<SaveSiteUrlState, FormData>(
    saveSiteUrlAction,
    {},
  );
  const [unpagesState, unpagesAction] = useActionState<SaveSiteUrlState, FormData>(
    unregisterPagesDomainAction,
    {},
  );
  const [host, setHost] = useState<HostingKind>(() =>
    initialHost(defaultRegisterPages, pagesCname),
  );

  const pagesHost = githubPagesHost(siteRepo);
  const records = pagesCname ? dnsRecordsForDomain(pagesCname, pagesHost) : [];
  const certNote = describePagesCertificate(certificateState);
  const error = saveState.error ?? unpagesState.error;
  const registerPages = host === "pages";
  const pagesDns = records.length > 0 ? <DnsTable rows={records} /> : undefined;

  return (
    <div className="space-y-4 p-5 text-sm leading-relaxed text-neutral-600">
      <Callout tone="amber" title="先填访客会打开的地址">
        链接和样式路径是编译时写进去的。换成自己的域名，必须在这里保存一次。
        <Link href="/help/custom-domain" className="ml-1 font-medium text-amber-800 underline hover:text-amber-950">
          各家怎么挂
        </Link>
      </Callout>

      <div>
        <p className="mb-2 font-medium text-neutral-800">站点接到哪家托管？</p>
        <HostingOptionButtons value={host} onChange={setHost} />
        <p className="mt-2 text-xs text-neutral-400">
          选 GitHub Pages 时保存会向 GitHub 登记域名；选其他则会取消 Pages 上已有的登记，只更新访客地址。
        </p>
      </div>

      {host !== "pages" && pagesCname ? (
        <Callout tone="rose" title="这个域名还登记在 GitHub Pages 上">
          保存后会自动取消 Pages 登记，避免两家抢证书。若要先腾出域名再去 Vercel / Cloudflare 添加，也可以只点下面的「取消 Pages 登记」。
        </Callout>
      ) : null}

      <form action={saveAction} className="space-y-3">
        <input type="hidden" name="siteId" value={siteId} />
        {registerPages ? <input type="hidden" name="registerPages" value="on" /> : null}
        <label className="block">
          <span className="font-medium text-neutral-800">访客地址</span>
          <input
            name="origin"
            defaultValue={currentUrl ?? defaultUrl}
            placeholder={defaultUrl}
            autoComplete="off"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-wp-accent focus:outline-none"
          />
          <span className="mt-1 block text-xs text-neutral-400">
            自己的域名填 <code className="font-mono">blog.example.com</code>；要回到默认 Pages 就填回{" "}
            <code className="break-all font-mono">{defaultUrl}</code>。
          </span>
        </label>
        {error && <p className="rounded bg-red-50 p-3 text-red-600">{error}</p>}
        {notice === "url" && (
          <p className="rounded bg-emerald-50 p-3 text-emerald-700">
            已更新站点地址并触发重建。请在你选的托管商控制台挂上同一域名。
          </p>
        )}
        {notice === "pages" && (
          <p className="rounded bg-emerald-50 p-3 text-emerald-700">
            已更新地址，并在 GitHub Pages 登记。请按步骤里的表加 DNS。
          </p>
        )}
        {notice === "reset" && (
          <p className="rounded bg-emerald-50 p-3 text-emerald-700">已改回默认 Pages 地址 {defaultUrl}</p>
        )}
        {notice === "unpages" && (
          <p className="rounded bg-emerald-50 p-3 text-emerald-700">
            已取消 Pages 上的域名登记。访客地址没变，请确认 DNS 指到你现在用的托管商。
          </p>
        )}
        <ProgressButton
          expectedSeconds={6}
          pendingLabel="保存中"
          buildSiteId={siteId}
          className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
        >
          保存地址
        </ProgressButton>
      </form>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
        <HostingSteps host={host} variant="settings" siteRepo={siteRepo} pagesDns={pagesDns} />
      </div>

      {pagesCname && (
        <div className="space-y-3 border-t border-neutral-100 pt-4">
          <p className="font-medium text-neutral-800">GitHub Pages 当前登记：{pagesCname}</p>
          {certNote && <p className="text-xs text-neutral-500">{certNote}</p>}
          <form action={unpagesAction}>
            <input type="hidden" name="siteId" value={siteId} />
            <ProgressButton
              expectedSeconds={5}
              pendingLabel="取消中"
              className="rounded border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-50"
            >
              仅取消 Pages 登记（保留访客地址）
            </ProgressButton>
          </form>
        </div>
      )}
    </div>
  );
}
