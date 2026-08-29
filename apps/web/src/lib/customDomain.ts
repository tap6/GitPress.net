/**
 * Canonical public URL vs optional GitHub Pages hostname registration.
 * Hosting (Pages / Vercel / Cloudflare / …) is the owner's choice; GitPress
 * only needs site.url + site.basePath so the build emits the right links.
 */

export const GITHUB_PAGES_IPV4 = [
  "185.199.108.153",
  "185.199.109.153",
  "185.199.110.153",
  "185.199.111.153",
] as const;

export const GITHUB_PAGES_IPV6 = [
  "2606:50c0:8000::153",
  "2606:50c0:8001::153",
  "2606:50c0:8002::153",
  "2606:50c0:8003::153",
] as const;

export interface DnsRecord {
  type: "A" | "AAAA" | "CNAME";
  name: string;
  value: string;
}

export interface PublicOrigin {
  url: string;
  basePath: string;
  host: string;
  isDefaultPages: boolean;
}

const HOST_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export function parseHostname(raw: string): { host: string } | { error: string } {
  let host = raw.trim().toLowerCase();
  host = host.replace(/^https?:\/\//, "");
  host = host.replace(/\/.*$/, "");
  host = host.replace(/\.$/, "");
  if (!host) return { error: "请填写域名或网址。" };
  if (host.includes(" ") || host.includes(":")) return { error: "请只填主机名，不要带端口或路径。" };
  if (!HOST_RE.test(host)) return { error: "请填写有效域名，例如 example.com。" };
  return { host };
}

/** @deprecated use parseHostname; kept for call sites that mean “custom host only”. */
export function parseCustomDomain(raw: string): { host: string } | { error: string } {
  const parsed = parseHostname(raw);
  if ("error" in parsed) return parsed;
  if (parsed.host.endsWith(".github.io") || parsed.host === "github.io") {
    return { error: "这是 GitHub Pages 自带地址，请改用你自己的域名，或填回默认的 github.io 网址。" };
  }
  return parsed;
}

/** Second-level public suffixes we treat as part of the registrable domain. */
const MULTI_PART_TLDS = new Set([
  "ac.uk",
  "co.uk",
  "gov.uk",
  "org.uk",
  "co.jp",
  "ne.jp",
  "or.jp",
  "com.au",
  "net.au",
  "org.au",
  "co.nz",
  "com.br",
  "com.cn",
  "com.hk",
  "com.tw",
  "co.kr",
  "co.in",
  "com.sg",
]);

function zoneLabelCount(host: string): number {
  const labels = host.split(".");
  if (labels.length >= 2 && MULTI_PART_TLDS.has(labels.slice(-2).join("."))) return 3;
  return 2;
}

/** True for the zone apex (example.com, example.co.uk), not www.example.com. */
export function isApexDomain(host: string): boolean {
  return host.split(".").length <= zoneLabelCount(host);
}

/** DNS 主机记录 relative to the inferred zone (blog.example.com → blog). */
export function dnsHostRecordName(host: string): string {
  if (isApexDomain(host)) return "@";
  const labels = host.split(".");
  return labels.slice(0, labels.length - zoneLabelCount(host)).join(".");
}

export function githubPagesDefaultUrl(siteRepo: string): string {
  const { owner, repo } = splitOwnerRepo(siteRepo);
  return `https://${owner.toLowerCase()}.github.io/${repo}/`;
}

export function githubPagesDefaultBasePath(siteRepo: string): string {
  const { repo } = splitOwnerRepo(siteRepo);
  return `/${repo}/`;
}

export function githubPagesHost(siteRepo: string): string {
  const { owner } = splitOwnerRepo(siteRepo);
  return `${owner.toLowerCase()}.github.io`;
}

export function customDomainUrl(host: string): string {
  return `https://${host}/`;
}

export function resolvePublicOrigin(raw: string, siteRepo: string): PublicOrigin | { error: string } {
  const defaultUrl = githubPagesDefaultUrl(siteRepo);
  const { owner, repo } = splitOwnerRepo(siteRepo);
  const defaultHost = `${owner.toLowerCase()}.github.io`;
  const defaultPath = `/${repo}`.toLowerCase();
  const trimmed = raw.trim();
  if (!trimmed) return { error: "请填写访客打开的地址。" };

  const withoutProto = trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const slash = withoutProto.indexOf("/");
  const hostPart = (slash === -1 ? withoutProto : withoutProto.slice(0, slash)).toLowerCase().replace(/\.$/, "");
  const pathPart = (slash === -1 ? "" : withoutProto.slice(slash)).toLowerCase().replace(/\/+$/, "") || "";

  if (hostPart === defaultHost && pathPart === defaultPath) {
    return {
      url: defaultUrl,
      basePath: githubPagesDefaultBasePath(siteRepo),
      host: defaultHost,
      isDefaultPages: true,
    };
  }

  const parsed = parseHostname(hostPart);
  if ("error" in parsed) return parsed;
  if (parsed.host.endsWith(".github.io") || parsed.host === "github.io") {
    return { error: `默认 Pages 地址是 ${defaultUrl}。自己的域名请填 hostname，不要填别人的 github.io。` };
  }
  return {
    url: customDomainUrl(parsed.host),
    basePath: "/",
    host: parsed.host,
    isDefaultPages: false,
  };
}

export function isDefaultPagesOrigin(raw: string | null | undefined, siteRepo: string): boolean {
  if (!raw || !raw.trim()) return true;
  const resolved = resolvePublicOrigin(raw, siteRepo);
  return !("error" in resolved) && resolved.isDefaultPages;
}

export function dnsRecordsForDomain(host: string, pagesHost: string): DnsRecord[] {
  if (isApexDomain(host)) {
    return [
      ...GITHUB_PAGES_IPV4.map((value) => ({ type: "A" as const, name: "@", value })),
      ...GITHUB_PAGES_IPV6.map((value) => ({ type: "AAAA" as const, name: "@", value })),
    ];
  }
  return [{ type: "CNAME", name: dnsHostRecordName(host), value: pagesHost }];
}

export function describePagesCertificate(state: string | null): string | null {
  if (!state) return null;
  if (state === "issued" || state === "uploaded" || state === "approved") {
    return "GitHub Pages 的 HTTPS 已就绪";
  }
  if (state === "errored") return "Pages 证书申请失败，先核对是否把 DNS 指到 GitHub";
  return "Pages 正在申请证书，等 DNS 生效即可";
}

function splitOwnerRepo(siteRepo: string): { owner: string; repo: string } {
  const [owner, repo] = siteRepo.split("/");
  return { owner: owner ?? "", repo: repo ?? "" };
}
