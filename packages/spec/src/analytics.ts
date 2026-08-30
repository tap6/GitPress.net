/**
 * Structured analytics providers on `site.analytics`.
 *
 * Themes never read this object. Builders (or the control plane) compile
 * enabled providers into `site.analyticsSnippet`; themes insert that string
 * verbatim before `</head>`. Disabled providers stay in gitpress.json so the
 * owner can turn them back on without re-entering IDs.
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
  /** When false/absent, builders omit this provider from analyticsSnippet. */
  enabled?: boolean;
  /** Optional third-party dashboard URL shown as a shortcut in the GitPress UI. */
  dashboardUrl?: string;
}

export interface Ga4AnalyticsProvider extends AnalyticsProviderBase {
  type: "ga4";
  /** GA4 Measurement ID, e.g. G-XXXXXXXX. */
  measurementId?: string;
}

export interface ClarityAnalyticsProvider extends AnalyticsProviderBase {
  type: "clarity";
  projectId?: string;
}

export interface CloudflareAnalyticsProvider extends AnalyticsProviderBase {
  type: "cloudflare";
  /** Cloudflare Web Analytics beacon token. */
  token?: string;
}

export interface BaiduAnalyticsProvider extends AnalyticsProviderBase {
  type: "baidu";
  /** hm.js site id (the hex string after hm.js?). */
  siteId?: string;
}

export interface UmamiAnalyticsProvider extends AnalyticsProviderBase {
  type: "umami";
  websiteId?: string;
  /** Script URL. Defaults to https://cloud.umami.is/script.js when compiling. */
  src?: string;
}

export interface La51AnalyticsProvider extends AnalyticsProviderBase {
  type: "51la";
  id?: string;
  /** Defaults to `id` when compiling. */
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

const DEFAULT_UMAMI_SRC = "https://cloud.umami.is/script.js";
const MAX_CUSTOM_HTML = 24 * 1024;
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
  if (value.length > MAX_DASHBOARD_URL) return { error: "看板链接过长。" };
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { error: "看板链接不是有效网址。" };
  }
  if (parsed.protocol !== "https:") return { error: "看板链接必须使用 https。" };
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
      return {
        type: "ga4",
        enabled,
        measurementId: trim(raw.measurementId) || undefined,
        dashboardUrl,
      };
    case "clarity":
      return {
        type: "clarity",
        enabled,
        projectId: trim(raw.projectId) || undefined,
        dashboardUrl,
      };
    case "cloudflare":
      return {
        type: "cloudflare",
        enabled,
        token: trim(raw.token) || undefined,
        dashboardUrl,
      };
    case "baidu":
      return {
        type: "baidu",
        enabled,
        siteId: trim(raw.siteId) || undefined,
        dashboardUrl,
      };
    case "umami":
      return {
        type: "umami",
        enabled,
        websiteId: trim(raw.websiteId) || undefined,
        src: trim(raw.src) || undefined,
        dashboardUrl,
      };
    case "51la":
      return {
        type: "51la",
        enabled,
        id: trim(raw.id) || undefined,
        ck: trim(raw.ck) || undefined,
        dashboardUrl,
      };
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
  switch (provider.type) {
    case "ga4":
      return "Google Analytics";
    case "clarity":
      return "Microsoft Clarity";
    case "cloudflare":
      return "Cloudflare Web Analytics";
    case "baidu":
      return "百度统计";
    case "umami":
      return "Umami";
    case "51la":
      return "51.LA";
    case "custom":
      return provider.label?.trim() || "自定义代码";
  }
}

export function validateEnabledProvider(provider: AnalyticsProvider): string | undefined {
  if (!provider.enabled) return undefined;
  const name = analyticsProviderLabel(provider);
  switch (provider.type) {
    case "ga4":
      if (!provider.measurementId || !GA4_ID.test(provider.measurementId.trim())) {
        return `${name}：请填写测量 ID（G- 开头）。`;
      }
      return undefined;
    case "clarity":
      if (!provider.projectId || !CLARITY_ID.test(provider.projectId.trim())) {
        return `${name}：请填写项目 ID。`;
      }
      return undefined;
    case "cloudflare":
      if (!provider.token || !CF_TOKEN.test(provider.token.trim())) {
        return `${name}：请填写 beacon token。`;
      }
      return undefined;
    case "baidu":
      if (!provider.siteId || !BAIDU_ID.test(provider.siteId.trim())) {
        return `${name}：请填写 hm.js 后面的站点 ID。`;
      }
      return undefined;
    case "umami": {
      if (!provider.websiteId || !UMAMI_ID.test(provider.websiteId.trim())) {
        return `${name}：请填写 website ID（UUID）。`;
      }
      const src = provider.src?.trim() || DEFAULT_UMAMI_SRC;
      const parsed = parseDashboardUrl(src);
      if ("error" in parsed || !parsed.url.endsWith(".js")) {
        return `${name}：脚本地址必须是 https 的 .js 链接。`;
      }
      return undefined;
    }
    case "51la":
      if (!provider.id || !LA51_ID.test(provider.id.trim())) {
        return `${name}：请填写统计 ID。`;
      }
      if (provider.ck && !LA51_ID.test(provider.ck.trim())) {
        return `${name}：ck 格式不正确。`;
      }
      return undefined;
    case "custom":
      if (!provider.html?.trim()) return `${name}：请粘贴要插入的代码。`;
      if (provider.html.length > MAX_CUSTOM_HTML) return `${name}：自定义代码过长。`;
      return undefined;
  }
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
      const token = provider.token!.trim();
      const beacon = JSON.stringify({ token });
      return `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${beacon}'></script>`;
    }
    case "baidu": {
      const id = provider.siteId!.trim();
      return `<script>var _hmt=_hmt||[];(function(){var hm=document.createElement("script");hm.src="https://hm.baidu.com/hm.js?${escapeJs(id)}";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(hm,s);})();</script>`;
    }
    case "umami": {
      const src = (provider.src?.trim() || DEFAULT_UMAMI_SRC);
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

/** HTML inserted before `</head>`. Empty string means delete analyticsSnippet. */
export function compileAnalyticsSnippet(providers: AnalyticsProvider[]): string {
  return providers
    .map(compileAnalyticsProvider)
    .filter(Boolean)
    .join("\n");
}

/**
 * If `site.analytics.providers` is present, rewrite `analyticsSnippet` from
 * enabled items. Absent `analytics` leaves a legacy hand-pasted snippet alone.
 */
export function applyCompiledAnalyticsSnippet(site: {
  analytics?: unknown;
  analyticsSnippet?: string;
}): void {
  if (!site.analytics || typeof site.analytics !== "object") return;
  const raw = site.analytics as Record<string, unknown>;
  if (!Array.isArray(raw.providers)) return;
  const snippet = compileAnalyticsSnippet(parseSiteAnalytics(site.analytics).providers ?? []);
  if (snippet) site.analyticsSnippet = snippet;
  else delete site.analyticsSnippet;
}
