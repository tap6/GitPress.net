"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { saveAnalyticsAction, type SaveAnalyticsState } from "@/lib/actions";
import {
  ANALYTICS_CATALOG,
  analyticsDashboardLinks,
  analyticsProviderLabel,
  type AnalyticsProvider,
} from "@/lib/analytics";
import { BUILD_TRIGGER_EVENT, type BuildTriggerDetail } from "@/components/buildTriggerEvent";
import { ProgressButton } from "@/components/ProgressButton";

interface Props {
  siteId: string;
  initial: AnalyticsProvider[];
}

function emptyCustom(): AnalyticsProvider {
  return { type: "custom", enabled: false, label: "", html: "", dashboardUrl: "" };
}

function patchAt(list: AnalyticsProvider[], index: number, patch: Partial<AnalyticsProvider>): AnalyticsProvider[] {
  return list.map((item, i) => (i === index ? ({ ...item, ...patch } as AnalyticsProvider) : item));
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-neutral-400">{hint}</span> : null}
    </label>
  );
}

function inputClassName() {
  return "mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none";
}

function ProviderFields({
  item,
  onChange,
}: {
  item: AnalyticsProvider;
  onChange: (patch: Partial<AnalyticsProvider>) => void;
}) {
  switch (item.type) {
    case "ga4":
      return (
        <Field label="测量 ID">
          <input
            value={item.measurementId ?? ""}
            onChange={(event) => onChange({ measurementId: event.target.value })}
            placeholder="G-XXXXXXXX"
            className={`${inputClassName()} font-mono text-xs`}
            autoComplete="off"
          />
        </Field>
      );
    case "clarity":
      return (
        <Field label="项目 ID">
          <input
            value={item.projectId ?? ""}
            onChange={(event) => onChange({ projectId: event.target.value })}
            className={`${inputClassName()} font-mono text-xs`}
            autoComplete="off"
          />
        </Field>
      );
    case "cloudflare":
      return (
        <Field label="Beacon token">
          <input
            value={item.token ?? ""}
            onChange={(event) => onChange({ token: event.target.value })}
            className={`${inputClassName()} font-mono text-xs`}
            autoComplete="off"
          />
        </Field>
      );
    case "baidu":
      return (
        <Field label="站点 ID">
          <input
            value={item.siteId ?? ""}
            onChange={(event) => onChange({ siteId: event.target.value })}
            placeholder="hm.js? 后面那串"
            className={`${inputClassName()} font-mono text-xs`}
            autoComplete="off"
          />
        </Field>
      );
    case "umami":
      return (
        <>
          <Field label="Website ID">
            <input
              value={item.websiteId ?? ""}
              onChange={(event) => onChange({ websiteId: event.target.value })}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className={`${inputClassName()} font-mono text-xs`}
              autoComplete="off"
            />
          </Field>
          <Field label="脚本地址" hint="自建 Umami 改成你的 script.js。留空则用 Umami Cloud。">
            <input
              value={item.src ?? ""}
              onChange={(event) => onChange({ src: event.target.value })}
              placeholder="https://cloud.umami.is/script.js"
              className={`${inputClassName()} font-mono text-xs`}
              autoComplete="off"
            />
          </Field>
        </>
      );
    case "51la":
      return (
        <>
          <Field label="统计 ID">
            <input
              value={item.id ?? ""}
              onChange={(event) => onChange({ id: event.target.value })}
              className={`${inputClassName()} font-mono text-xs`}
              autoComplete="off"
            />
          </Field>
          <Field label="ck（可选）" hint="留空则与统计 ID 相同。">
            <input
              value={item.ck ?? ""}
              onChange={(event) => onChange({ ck: event.target.value })}
              className={`${inputClassName()} font-mono text-xs`}
              autoComplete="off"
            />
          </Field>
        </>
      );
    case "custom":
      return (
        <>
          <Field label="名称">
            <input
              value={item.label ?? ""}
              onChange={(event) => onChange({ label: event.target.value })}
              placeholder="例如 Plausible"
              className={inputClassName()}
            />
          </Field>
          <Field label="代码" hint="原样插入每个页面的 </head> 前。后台只当文本保存，不会在这里执行。">
            <textarea
              value={item.html ?? ""}
              onChange={(event) => onChange({ html: event.target.value })}
              rows={4}
              placeholder={"<script defer src=\"https://…\"></script>"}
              className={`${inputClassName()} font-mono text-xs`}
              spellCheck={false}
            />
          </Field>
        </>
      );
  }
}

export function AnalyticsForm({ siteId, initial }: Props) {
  const [providers, setProviders] = useState<AnalyticsProvider[]>(initial);
  const [state, formAction] = useActionState<SaveAnalyticsState, FormData>(saveAnalyticsAction, {});

  useEffect(() => {
    if (!state.rebuilt) return;
    window.dispatchEvent(
      new CustomEvent<BuildTriggerDetail>(BUILD_TRIGGER_EVENT, { detail: { siteId } }),
    );
  }, [state, siteId]);

  const links = useMemo(() => analyticsDashboardLinks(providers), [providers]);
  const customCount = providers.filter((item) => item.type === "custom").length;

  return (
    <form action={formAction} className="space-y-5 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="providers" value={JSON.stringify(providers)} />

      {links.length > 0 ? (
        <div className="rounded border border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">打开看板</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={`${link.label}:${link.url}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 hover:border-wp-accent hover:text-wp-accent"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {providers.map((item, index) => {
        const catalog = item.type === "custom" ? undefined : ANALYTICS_CATALOG.find((row) => row.type === item.type);
        return (
          <section key={`${item.type}-${index}`} className="rounded border border-neutral-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
              <div>
                <h3 className="font-semibold text-neutral-800">
                  {catalog?.label ?? analyticsProviderLabel(item)}
                </h3>
                {catalog ? (
                  <p className="mt-1 text-xs text-neutral-400">{catalog.hint}</p>
                ) : (
                  <p className="mt-1 text-xs text-neutral-400">Plausible、GoatCounter 或其他脚本都可以加在这里。</p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.enabled === true}
                  onChange={(event) => setProviders((list) => patchAt(list, index, { enabled: event.target.checked }))}
                  className="accent-wp-accent"
                />
                编入网站
              </label>
            </div>
            <div className="space-y-3 px-4 py-4">
              {catalog ? (
                <p>
                  <a
                    href={catalog.createUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-wp-accent hover:underline"
                  >
                    {catalog.createLabel} ↗
                  </a>
                </p>
              ) : null}
              <ProviderFields
                item={item}
                onChange={(patch) => setProviders((list) => patchAt(list, index, patch))}
              />
              <Field label="看板链接（可选）" hint="填了之后，开启时会出现在本页顶部，方便跳到对方后台。">
                <input
                  value={item.dashboardUrl ?? ""}
                  onChange={(event) => setProviders((list) => patchAt(list, index, { dashboardUrl: event.target.value }))}
                  placeholder="https://"
                  className={inputClassName()}
                  autoComplete="off"
                />
              </Field>
              {item.type === "custom" ? (
                <button
                  type="button"
                  onClick={() => setProviders((list) => list.filter((_, i) => i !== index))}
                  className="text-xs text-neutral-500 hover:text-red-600"
                >
                  删除这条自定义代码
                </button>
              ) : null}
            </div>
          </section>
        );
      })}

      {customCount < 10 ? (
        <button
          type="button"
          onClick={() => setProviders((list) => [...list, emptyCustom()])}
          className="rounded border border-dashed border-neutral-300 px-4 py-2 text-neutral-600 hover:border-wp-accent hover:text-wp-accent"
        >
          添加自定义代码
        </button>
      ) : null}

      {state.error ? <p className="rounded bg-red-50 p-3 text-red-600">{state.error}</p> : null}
      {state.saved ? (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">
          {state.rebuilt
            ? "已保存，开启的统计将在约 1 分钟后出现在站点上。"
            : "已保存。这次没有改公开站点上的脚本，未触发构建。"}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <ProgressButton
          expectedSeconds={4}
          pendingLabel="保存中"
          className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
        >
          保存
        </ProgressButton>
        <Link href="/help/analytics" className="text-xs text-neutral-400 hover:text-wp-accent">
          怎样看访问量
        </Link>
      </div>
    </form>
  );
}
