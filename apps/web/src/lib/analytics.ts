/**
 * Analytics providers live in the data-repo `gitpress.json` (not Neon).
 * Themes only insert the compiled `analyticsSnippet`; this module is the
 * control-plane view of `site.analytics`.
 */

export const ANALYTICS_PROVIDER_TYPES = [
  "ga4",
  "clarity",
  "cloudflare",
  "baidu",
  "umami",
  "51la",
  "custom",
] as const;

export type AnalyticsProviderType = (typeof ANALYTICS_PROVIDER_TYPES)[number];

export const BUILTIN_ANALYTICS_TYPES = [
  "ga4",
  "clarity",
  "cloudflare",
  "baidu",
  "umami",
  "51la",
] as const;

export type BuiltinAnalyticsType = (typeof BUILTIN_ANALYTICS_TYPES)[number];

export interface AnalyticsProviderBase {
  type: AnalyticsProviderType;
  enabled?: boolean;
  dashboardUrl?: string;
}

export interface Ga4AnalyticsProvider extends AnalyticsProviderBase {
  type: "ga4";
  measurementId?: string;
}

export interface ClarityAnalyticsProvider extends AnalyticsProviderBase {
  type: "clarity";
  projectId?: string;
}

export interface CloudflareAnalyticsProvider extends AnalyticsProviderBase {
  type: "cloudflare";
  token?: string;
}

export interface BaiduAnalyticsProvider extends AnalyticsProviderBase {
  type: "baidu";
  siteId?: string;
}

export interface UmamiAnalyticsProvider extends AnalyticsProviderBase {
  type: "umami";
  websiteId?: string;
  src?: string;
}

export interface La51AnalyticsProvider extends AnalyticsProviderBase {
  type: "51la";
  id?: string;
  ck?: string;
}

export interface CustomAnalyticsProvider extends AnalyticsProviderBase {
  type: "custom";
  label?: string;
  html?: string;
}

export type AnalyticsProvider =
  | Ga4AnalyticsProvider
  | ClarityAnalyticsProvider
  | CloudflareAnalyticsProvider
  | BaiduAnalyticsProvider
  | UmamiAnalyticsProvider
  | La51AnalyticsProvider
  | CustomAnalyticsProvider;

export interface SiteAnalytics {
  providers?: AnalyticsProvider[];
}

export interface AnalyticsCatalogItem {
  type: BuiltinAnalyticsType;
  label: string;
  createUrl: string;
  createLabel: string;
  hint: string;
}

export const ANALYTICS_CATALOG: AnalyticsCatalogItem[] = [
  {
    type: "ga4",
    label: "Google Analytics",
    createUrl: "https://analytics.google.com/",
    createLabel: "打开 Google Analytics",
    hint: "创建媒体资源后，在管理 → 数据流里复制测量 ID（G- 开头）。国内访客可能统计不全。",
  },
  {
    type: "clarity",
    label: "Microsoft Clarity",
    createUrl: "https://clarity.microsoft.com/",
    createLabel: "打开 Clarity",
    hint: "创建项目后复制 Project ID。可与上面的流量统计同时开启，用来看热力图和录屏。",
  },
  {
    type: "cloudflare",
    label: "Cloudflare Web Analytics",
    createUrl: "https://dash.cloudflare.com/?to=/:account/web-analytics",
    createLabel: "打开 Cloudflare",
    hint: "添加站点后复制 beacon token。读者在国内时，上报可能丢数。",
  },
  {
    type: "baidu",
    label: "Baidu",
    createUrl: "https://tongji.baidu.com/",
    createLabel: "Open Baidu Tongji",
    hint: "After you get the code, copy the site ID after hm.js?.",
  },
  {
    type: "umami",
    label: "Umami",
    createUrl: "https://cloud.umami.is/",
    createLabel: "打开 Umami Cloud",
    hint: "Cloud 或自建均可。Website ID 是 UUID；自建请改脚本地址。",
  },
  {
    type: "51la",
    label: "51.LA",
    createUrl: "https://www.51.la/",
    createLabel: "打开 51.LA",
    hint: "复制后台的统计 id。ck 可留空，默认与 id 相同。",
  },
];

const DEFAULT_UMAMI_SRC = "https://cloud.umami.is/script.js";
const MAX_CUSTOM_HTML = 24 * 1024;
const MAX_CUSTOM_ITEMS = 10;
const MAX_DASHBOARD_URL = 500;

function isProviderType(value: string): value is AnalyticsProviderType {
  return (ANALYTICS_PROVIDER_TYPES as readonly string[]).includes(value);
}

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseDashboardUrl(raw: string): { url: string } | { error: string } {
  const value = raw.trim();
  if (!value) return { url: "" };
  if (value.length > MAX_DASHBOARD_URL) return { error: "analyticsDashboardTooLong" };
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { error: "analyticsDashboardInvalid" };
  }
  if (parsed.protocol !== "https:") return { error: "analyticsDashboardHttps" };
  return { url: parsed.toString() };
}

function persistDashboard(raw: unknown): string | undefined {
  const parsed = parseDashboardUrl(typeof raw === "string" ? raw : "");
  return "url" in parsed && parsed.url ? parsed.url : undefined;
}

export function parseAnalyticsProvider(value: unknown): AnalyticsProvider | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  if (typeof raw.type !== "string" || !isProviderType(raw.type)) return undefined;
  const enabled = raw.enabled === true;
  const dashboardUrl = persistDashboard(raw.dashboardUrl);
  switch (raw.type) {
    case "ga4":
      return { type: "ga4", enabled, measurementId: trim(raw.measurementId) || undefined, dashboardUrl };
    case "clarity":
      return { type: "clarity", enabled, projectId: trim(raw.projectId) || undefined, dashboardUrl };
    case "cloudflare":
      return { type: "cloudflare", enabled, token: trim(raw.token) || undefined, dashboardUrl };
    case "baidu":
      return { type: "baidu", enabled, siteId: trim(raw.siteId) || undefined, dashboardUrl };
    case "umami":
      return {
        type: "umami",
        enabled,
        websiteId: trim(raw.websiteId) || undefined,
        src: trim(raw.src) || undefined,
        dashboardUrl,
      };
    case "51la":
      return { type: "51la", enabled, id: trim(raw.id) || undefined, ck: trim(raw.ck) || undefined, dashboardUrl };
    case "custom":
      return {
        type: "custom",
        enabled,
        label: trim(raw.label) || undefined,
        html: typeof raw.html === "string" ? raw.html : undefined,
        dashboardUrl,
      };
  }
}

export function parseSiteAnalytics(value: unknown): SiteAnalytics {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.providers)) return {};
  const seenBuiltin = new Set<string>();
  const providers: AnalyticsProvider[] = [];
  for (const item of raw.providers) {
    const parsed = parseAnalyticsProvider(item);
    if (!parsed) continue;
    if (parsed.type !== "custom") {
      if (seenBuiltin.has(parsed.type)) continue;
      seenBuiltin.add(parsed.type);
    }
    providers.push(parsed);
  }
  return { providers };
}

function hasPersistableFields(provider: AnalyticsProvider): boolean {
  if (provider.enabled) return true;
  if (provider.dashboardUrl) return true;
  switch (provider.type) {
    case "ga4":
      return Boolean(provider.measurementId);
    case "clarity":
      return Boolean(provider.projectId);
    case "cloudflare":
      return Boolean(provider.token);
    case "baidu":
      return Boolean(provider.siteId);
    case "umami":
      return Boolean(provider.websiteId || provider.src);
    case "51la":
      return Boolean(provider.id || provider.ck);
    case "custom":
      return Boolean(provider.label || provider.html?.trim());
  }
}

export function persistAnalyticsProvider(provider: AnalyticsProvider): AnalyticsProvider | undefined {
  if (!hasPersistableFields(provider)) return undefined;
  const dashboardUrl = persistDashboard(provider.dashboardUrl ?? "");
  const enabled = provider.enabled === true;
  switch (provider.type) {
    case "ga4":
      return {
        type: "ga4",
        enabled,
        ...(provider.measurementId ? { measurementId: provider.measurementId.trim() } : {}),
        ...(dashboardUrl ? { dashboardUrl } : {}),
      };
    case "clarity":
      return {
        type: "clarity",
        enabled,
        ...(provider.projectId ? { projectId: provider.projectId.trim() } : {}),
        ...(dashboardUrl ? { dashboardUrl } : {}),
      };
    case "cloudflare":
      return {
        type: "cloudflare",
        enabled,
        ...(provider.token ? { token: provider.token.trim() } : {}),
        ...(dashboardUrl ? { dashboardUrl } : {}),
      };
    case "baidu":
      return {
        type: "baidu",
        enabled,
        ...(provider.siteId ? { siteId: provider.siteId.trim() } : {}),
        ...(dashboardUrl ? { dashboardUrl } : {}),
      };
    case "umami":
      return {
        type: "umami",
        enabled,
        ...(provider.websiteId ? { websiteId: provider.websiteId.trim() } : {}),
        ...(provider.src ? { src: provider.src.trim() } : {}),
        ...(dashboardUrl ? { dashboardUrl } : {}),
      };
    case "51la":
      return {
        type: "51la",
        enabled,
        ...(provider.id ? { id: provider.id.trim() } : {}),
        ...(provider.ck ? { ck: provider.ck.trim() } : {}),
        ...(dashboardUrl ? { dashboardUrl } : {}),
      };
    case "custom":
      return {
        type: "custom",
        enabled,
        ...(provider.label?.trim() ? { label: provider.label.trim() } : {}),
        ...(provider.html?.trim() ? { html: provider.html } : {}),
        ...(dashboardUrl ? { dashboardUrl } : {}),
      };
  }
}

export function persistSiteAnalytics(providers: AnalyticsProvider[]): SiteAnalytics | undefined {
  const next = providers
    .map(persistAnalyticsProvider)
    .filter((item): item is AnalyticsProvider => Boolean(item));
  if (next.length === 0) return undefined;
  return { providers: next };
}

const GA4_ID = /^G-[A-Z0-9]+$/i;
const CLARITY_ID = /^[A-Za-z0-9]+$/;
const CF_TOKEN = /^[A-Za-z0-9_-]{8,128}$/;
const BAIDU_ID = /^[a-f0-9]{16,32}$/i;
const UMAMI_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LA51_ID = /^[A-Za-z0-9]{4,32}$/;

export function analyticsProviderLabel(provider: AnalyticsProvider): string {
  if (provider.type === "custom") return provider.label?.trim() || "Custom";
  return ANALYTICS_CATALOG.find((item) => item.type === provider.type)?.label ?? provider.type;
}

export function validateEnabledProvider(provider: AnalyticsProvider): string | undefined {
  if (!provider.enabled) {
    if (provider.dashboardUrl) {
      const parsed = parseDashboardUrl(provider.dashboardUrl);
      if ("error" in parsed) return parsed.error;
    }
    return undefined;
  }
  if (provider.dashboardUrl) {
    const parsed = parseDashboardUrl(provider.dashboardUrl);
    if ("error" in parsed) return parsed.error;
  }
  switch (provider.type) {
    case "ga4":
      if (!provider.measurementId || !GA4_ID.test(provider.measurementId.trim())) {
        return "analyticsNeedGa4";
      }
      return undefined;
    case "clarity":
      if (!provider.projectId || !CLARITY_ID.test(provider.projectId.trim())) {
        return "analyticsNeedClarity";
      }
      return undefined;
    case "cloudflare":
      if (!provider.token || !CF_TOKEN.test(provider.token.trim())) {
        return "analyticsNeedCfToken";
      }
      return undefined;
    case "baidu":
      if (!provider.siteId || !BAIDU_ID.test(provider.siteId.trim())) {
        return "analyticsNeedBaidu";
      }
      return undefined;
    case "umami": {
      if (!provider.websiteId || !UMAMI_ID.test(provider.websiteId.trim())) {
        return "analyticsNeedUmami";
      }
      const src = provider.src?.trim() || DEFAULT_UMAMI_SRC;
      const parsed = parseDashboardUrl(src);
      if ("error" in parsed || !("url" in parsed) || !parsed.url.toLowerCase().includes(".js")) {
        return "analyticsNeedUmamiSrc";
      }
      return undefined;
    }
    case "51la":
      if (!provider.id || !LA51_ID.test(provider.id.trim())) {
        return "analyticsNeed51la";
      }
      if (provider.ck && !LA51_ID.test(provider.ck.trim())) {
        return "analyticsBad51laCk";
      }
      return undefined;
    case "custom":
      if (!provider.html?.trim()) return "analyticsNeedCustomHtml";
      if (provider.html.length > MAX_CUSTOM_HTML) return "analyticsCustomTooLong";
      return undefined;
  }
}

export function validateAnalyticsProviders(providers: AnalyticsProvider[]): string | undefined {
  const customs = providers.filter((item) => item.type === "custom");
  if (customs.length > MAX_CUSTOM_ITEMS) return "analyticsTooManyCustom";
  for (const provider of providers) {
    const error = validateEnabledProvider(provider);
    if (error) return error;
  }
  return undefined;
}

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeJs(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'").replaceAll('"', "\\\"");
}

export function compileAnalyticsProvider(provider: AnalyticsProvider): string {
  if (provider.enabled !== true) return "";
  if (validateEnabledProvider(provider)) return "";
  switch (provider.type) {
    case "ga4": {
      const id = provider.measurementId!.trim();
      return [
        `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeAttr(id)}"></script>`,
        `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${escapeJs(id)}');</script>`,
      ].join("\n");
    }
    case "clarity": {
      const id = provider.projectId!.trim();
      return `<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${escapeJs(id)}");</script>`;
    }
    case "cloudflare": {
      const beacon = JSON.stringify({ token: provider.token!.trim() });
      return `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${beacon}'></script>`;
    }
    case "baidu": {
      const id = provider.siteId!.trim();
      return `<script>var _hmt=_hmt||[];(function(){var hm=document.createElement("script");hm.src="https://hm.baidu.com/hm.js?${escapeJs(id)}";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(hm,s);})();</script>`;
    }
    case "umami": {
      const src = provider.src?.trim() || DEFAULT_UMAMI_SRC;
      return `<script defer src="${escapeAttr(src)}" data-website-id="${escapeAttr(provider.websiteId!.trim())}"></script>`;
    }
    case "51la": {
      const id = provider.id!.trim();
      const ck = provider.ck?.trim() || id;
      return [
        `<script charset="UTF-8" id="LA_COLLECT" src="https://sdk.51.la/js-sdk-pro.min.js"></script>`,
        `<script>LA.init({id:"${escapeJs(id)}",ck:"${escapeJs(ck)}"})</script>`,
      ].join("\n");
    }
    case "custom":
      return provider.html!.trim();
  }
}

export function compileAnalyticsSnippet(providers: AnalyticsProvider[]): string {
  return providers.map(compileAnalyticsProvider).filter(Boolean).join("\n");
}

export function emptyBuiltinProviders(): AnalyticsProvider[] {
  return BUILTIN_ANALYTICS_TYPES.map((type) => ({ type, enabled: false }));
}

/**
 * Editor rows: every builtin card, then saved custom items.
 * A hand-pasted `analyticsSnippet` with no `site.analytics` becomes one custom row.
 */
export function analyticsProvidersForEditor(
  analytics: unknown,
  legacySnippet?: string,
): AnalyticsProvider[] {
  const hasStructured = Boolean(analytics && typeof analytics === "object");
  const saved = hasStructured ? (parseSiteAnalytics(analytics).providers ?? []) : [];
  const builtins = BUILTIN_ANALYTICS_TYPES.map(
    (type) => saved.find((item) => item.type === type) ?? ({ type, enabled: false } as AnalyticsProvider),
  );
  const customs = saved.filter((item) => item.type === "custom");
  if (!hasStructured) {
    const snippet = legacySnippet?.trim() ?? "";
    if (snippet) {
      customs.push({ type: "custom", enabled: true, label: "Custom", html: snippet });
    }
  }
  return [...builtins, ...customs];
}

export function analyticsDashboardLinks(providers: AnalyticsProvider[]): Array<{ label: string; url: string }> {
  const links: Array<{ label: string; url: string }> = [];
  for (const provider of providers) {
    if (provider.enabled !== true || !provider.dashboardUrl) continue;
    const parsed = parseDashboardUrl(provider.dashboardUrl);
    if (!("url" in parsed) || !parsed.url) continue;
    links.push({ label: analyticsProviderLabel(provider), url: parsed.url });
  }
  return links;
}
