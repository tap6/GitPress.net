"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  removeCustomDomainAction,
  saveCustomDomainAction,
  type SaveCustomDomainState,
} from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import {
  describePagesCertificate,
  dnsRecordsForDomain,
  githubPagesHost,
  parseCustomDomain,
} from "@/lib/customDomain";

interface Props {
  siteId: string;
  siteRepo: string;
  currentUrl: string | null;
  defaultUrl: string;
  pagesCname: string | null;
  certificateState: string | null;
  notice?: "saved" | "removed" | null;
}

export function CustomDomainForm({
  siteId,
  siteRepo,
  currentUrl,
  defaultUrl,
  pagesCname,
  certificateState,
  notice = null,
}: Props) {
  const [saveState, saveAction] = useActionState<SaveCustomDomainState, FormData>(
    saveCustomDomainAction,
    {},
  );
  const [removeState, removeAction] = useActionState<SaveCustomDomainState, FormData>(
    removeCustomDomainAction,
    {},
  );

  const boundHost = pagesCname ?? hostFromUrl(currentUrl, defaultUrl);
  const pagesHost = githubPagesHost(siteRepo);
  const records = boundHost ? dnsRecordsForDomain(boundHost, pagesHost) : [];
  const certNote = describePagesCertificate(certificateState);
  const error = saveState.error ?? removeState.error;

  return (
    <div className="space-y-4 p-5 text-sm leading-relaxed text-neutral-600">
      <p>
        GitPress 可以用已有的 GitHub Pages 权限，把域名登记到你的公开网站仓库。
        <strong className="font-medium text-neutral-800">解析记录必须你自己在域名注册商添加</strong>
        ——GitHub 登录不了阿里云、Cloudflare 或 Namecheap。
        <Link href="/help/custom-domain" className="ml-1 text-wp-accent hover:underline">
          查看完整步骤
        </Link>
      </p>

      <form action={saveAction} className="space-y-3">
        <input type="hidden" name="siteId" value={siteId} />
        <label className="block">
          <span className="font-medium text-neutral-800">自定义域名</span>
          <input
            name="domain"
            defaultValue={boundHost ?? ""}
            placeholder="blog.example.com"
            autoComplete="off"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-wp-accent focus:outline-none"
          />
        </label>
        {error && <p className="rounded bg-red-50 p-3 text-red-600">{error}</p>}
        {(notice === "saved" || saveState.saved) && (
          <p className="rounded bg-emerald-50 p-3 text-emerald-700">
            已告诉 GitHub 使用这个域名，并改好了站点地址。接下来请按下面表格添加 DNS，等生效后再用 HTTPS 访问。
          </p>
        )}
        {(notice === "removed" || removeState.removed) && (
          <p className="rounded bg-emerald-50 p-3 text-emerald-700">
            已解除绑定，站点将回到 {defaultUrl}
          </p>
        )}
        <ProgressButton
          expectedSeconds={6}
          pendingLabel="绑定中"
          buildSiteId={siteId}
          className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
        >
          {boundHost ? "更新域名" : "绑定到 GitHub Pages"}
        </ProgressButton>
      </form>

      {boundHost && (
        <>
          <div>
            <p className="font-medium text-neutral-800">请在域名注册商添加这些记录</p>
            <p className="mt-1 text-xs text-neutral-400">
              主机/名称一栏按服务商习惯填写（有的要写完整域名，有的只写 {records[0]?.name}）。
              通常几分钟生效，最长可能要等 24 小时。
            </p>
            <div className="mt-2 overflow-x-auto rounded border border-neutral-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">类型</th>
                    <th className="px-3 py-2 font-medium">名称</th>
                    <th className="px-3 py-2 font-medium">值</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row) => (
                    <tr key={`${row.type}-${row.name}-${row.value}`} className="border-t border-neutral-100">
                      <td className="px-3 py-2 font-mono">{row.type}</td>
                      <td className="px-3 py-2 font-mono">{row.name}</td>
                      <td className="break-all px-3 py-2 font-mono">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {certNote && <p className="text-xs text-neutral-500">{certNote}</p>}
          <form action={removeAction}>
            <input type="hidden" name="siteId" value={siteId} />
            <ProgressButton
              expectedSeconds={5}
              pendingLabel="解除中"
              buildSiteId={siteId}
              className="rounded border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-50"
            >
              解除绑定，恢复 GitHub Pages 地址
            </ProgressButton>
          </form>
        </>
      )}
    </div>
  );
}

function hostFromUrl(currentUrl: string | null, defaultUrl: string): string | null {
  if (!currentUrl || currentUrl === defaultUrl) return null;
  const parsed = parseCustomDomain(currentUrl);
  return "host" in parsed ? parsed.host : null;
}
