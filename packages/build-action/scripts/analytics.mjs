/**
 * Compile `site.analytics.providers` into `site.analyticsSnippet`.
 * Themes only insert the snippet. Disabled providers stay in gitpress.json
 * but are omitted from the generated HTML.
 */

const DEFAULT_UMAMI_SRC = "https://cloud.umami.is/script.js";
const TYPES = new Set(["ga4", "clarity", "cloudflare", "baidu", "umami", "51la", "custom"]);
const GA4_ID = /^G-[A-Z0-9]+$/i;
const CLARITY_ID = /^[A-Za-z0-9]+$/;
const CF_TOKEN = /^[A-Za-z0-9_-]{8,128}$/;
const BAIDU_ID = /^[a-f0-9]{16,32}$/i;
const UMAMI_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LA51_ID = /^[A-Za-z0-9]{4,32}$/;

function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeAttr(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeJs(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'").replaceAll('"', "\\\"");
}

function compileProvider(raw) {
  if (!raw || typeof raw !== "object" || raw.enabled !== true) return "";
  const type = raw.type;
  if (!TYPES.has(type)) return "";
  if (type === "ga4") {
    const id = trim(raw.measurementId);
    if (!GA4_ID.test(id)) return "";
    return [
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeAttr(id)}"></script>`,
      `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${escapeJs(id)}');</script>`,
    ].join("\n");
  }
  if (type === "clarity") {
    const id = trim(raw.projectId);
    if (!CLARITY_ID.test(id)) return "";
    return `<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${escapeJs(id)}");</script>`;
  }
  if (type === "cloudflare") {
    const token = trim(raw.token);
    if (!CF_TOKEN.test(token)) return "";
    return `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${JSON.stringify({ token })}'></script>`;
  }
  if (type === "baidu") {
    const id = trim(raw.siteId);
    if (!BAIDU_ID.test(id)) return "";
    return `<script>var _hmt=_hmt||[];(function(){var hm=document.createElement("script");hm.src="https://hm.baidu.com/hm.js?${escapeJs(id)}";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(hm,s);})();</script>`;
  }
  if (type === "umami") {
    const websiteId = trim(raw.websiteId);
    const src = trim(raw.src) || DEFAULT_UMAMI_SRC;
    if (!UMAMI_ID.test(websiteId) || !src.startsWith("https://") || !src.toLowerCase().includes(".js")) return "";
    return `<script defer src="${escapeAttr(src)}" data-website-id="${escapeAttr(websiteId)}"></script>`;
  }
  if (type === "51la") {
    const id = trim(raw.id);
    const ck = trim(raw.ck) || id;
    if (!LA51_ID.test(id) || !LA51_ID.test(ck)) return "";
    return [
      `<script charset="UTF-8" id="LA_COLLECT" src="https://sdk.51.la/js-sdk-pro.min.js"></script>`,
      `<script>LA.init({id:"${escapeJs(id)}",ck:"${escapeJs(ck)}"})</script>`,
    ].join("\n");
  }
  if (type === "custom") {
    return typeof raw.html === "string" ? raw.html.trim() : "";
  }
  return "";
}

export function applyAnalyticsSnippet(config) {
  const site = config?.site;
  if (!site || typeof site !== "object") return;
  const analytics = site.analytics;
  if (!analytics || typeof analytics !== "object") return;
  if (!Array.isArray(analytics.providers)) return;
  const snippet = analytics.providers.map(compileProvider).filter(Boolean).join("\n");
  if (snippet) site.analyticsSnippet = snippet;
  else delete site.analyticsSnippet;
}
