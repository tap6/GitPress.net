"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { saveAnalyticsAction, type SaveAnalyticsState } from "@/lib/actions";
import {
  ANALYTICS_CATALOG,
  analyticsDashboardLinks,
  analyticsProviderLabel,
  type AnalyticsProvider,
  type BuiltinAnalyticsType,
} from "@/lib/analytics";
import { BUILD_TRIGGER_EVENT, type BuildTriggerDetail } from "@/components/buildTriggerEvent";
import { FormError } from "@/components/FormError";
import { ProgressButton } from "@/components/ProgressButton";

interface Props {
  siteId: string;
  initial: AnalyticsProvider[];
}

const HINT_KEY: Record<BuiltinAnalyticsType, string> = {
  ga4: "hintGa",
  clarity: "hintClarity",
  cloudflare: "hintCf",
  baidu: "hintBaidu",
  umami: "hintUmami",
  "51la": "hint51la",
};

const OPEN_KEY: Record<BuiltinAnalyticsType, string> = {
  ga4: "openGa",
  clarity: "openClarity",
  cloudflare: "openCf",
  baidu: "openBaidu",
  umami: "openUmami",
  "51la": "open51la",
};

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
  const t = useTranslations("analyticsUi");
  switch (item.type) {
    case "ga4":
      return (
        <Field label={t("measurementId")}>
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
        <Field label={t("projectId")}>
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
        <Field label={t("siteId")}>
          <input
            value={item.siteId ?? ""}
            onChange={(event) => onChange({ siteId: event.target.value })}
            placeholder={t("baiduPlaceholder")}
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
          <Field label={t("scriptSrc")} hint={t("scriptHint")}>
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
          <Field label={t("statId")}>
            <input
              value={item.id ?? ""}
              onChange={(event) => onChange({ id: event.target.value })}
              className={`${inputClassName()} font-mono text-xs`}
              autoComplete="off"
            />
          </Field>
          <Field label={t("ckOptional")} hint={t("ckHint")}>
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
          <Field label={t("name")}>
            <input
              value={item.label ?? ""}
              onChange={(event) => onChange({ label: event.target.value })}
              placeholder={t("customPlaceholder")}
              className={inputClassName()}
            />
          </Field>
          <Field label={t("code")} hint={t("codeHint")}>
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
  const t = useTranslations("analyticsUi");
  const tc = useTranslations("common");
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

  function titleFor(item: AnalyticsProvider) {
    if (item.type === "custom") return analyticsProviderLabel(item) || t("customFallback");
    if (item.type === "baidu") return t("labelBaidu");
    return ANALYTICS_CATALOG.find((row) => row.type === item.type)?.label ?? item.type;
  }

  function linkLabel(label: string) {
    if (label === "Baidu" || label === "百度统计") return t("labelBaidu");
    if (label === "Custom") return t("customFallback");
    return label;
  }

  return (
    <form action={formAction} className="space-y-5 p-5 text-sm">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="providers" value={JSON.stringify(providers)} />

      {links.length > 0 ? (
        <div className="rounded border border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t("dashboards")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={`${link.label}:${link.url}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 hover:border-wp-accent hover:text-wp-accent"
              >
                {linkLabel(link.label)} ↗
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
                <h3 className="font-semibold text-neutral-800">{titleFor(item)}</h3>
                {catalog ? (
                  <p className="mt-1 text-xs text-neutral-400">{t(HINT_KEY[catalog.type])}</p>
                ) : (
                  <p className="mt-1 text-xs text-neutral-400">{t("customHint")}</p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.enabled === true}
                  onChange={(event) => setProviders((list) => patchAt(list, index, { enabled: event.target.checked }))}
                  className="accent-wp-accent"
                />
                {t("embed")}
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
                    {t(OPEN_KEY[catalog.type])} ↗
                  </a>
                </p>
              ) : null}
              <ProviderFields
                item={item}
                onChange={(patch) => setProviders((list) => patchAt(list, index, patch))}
              />
              <Field label={t("dashUrl")} hint={t("dashHint")}>
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
                  {t("deleteCustom")}
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
          {t("addCustom")}
        </button>
      ) : null}

      <FormError error={state.error} />
      {state.saved ? (
        <p className="rounded bg-emerald-50 p-3 text-emerald-700">
          {state.rebuilt ? t("savedRebuild") : t("savedNoRebuild")}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <ProgressButton
          expectedSeconds={4}
          pendingLabel={tc("saving")}
          className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
        >
          {tc("save")}
        </ProgressButton>
        <Link href="/help/analytics" className="text-xs text-neutral-400 hover:text-wp-accent">
          {t("help")}
        </Link>
      </div>
    </form>
  );
}
