/**
 * Custom domains live on GitHub Pages (the public site repo). GitPress can
 * register the hostname with GitHub and rewrite site.url / basePath; DNS at
 * the registrar is still the owner's job.
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

const HOST_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export function parseCustomDomain(raw: string): { host: string } | { error: string } {
  let host = raw.trim().toLowerCase();
  host = host.replace(/^https?:\/\//, "");
  host = host.replace(/\/.*$/, "");
  host = host.replace(/\.$/, "");
  if (!host) return { error: "请填写域名。" };
  if (host.includes(" ") || host.includes(":")) return { error: "请只填主机名，不要带端口或路径。" };
  if (host.endsWith(".github.io") || host === "github.io") {
    return { error: "这是 GitHub Pages 自带地址，不是自定义域名。" };
  }
  if (!HOST_RE.test(host)) return { error: "请填写有效域名，例如 blog.example.com。" };
  return { host };
}

/** Two labels → treat as apex (example.com). co.uk-style suffixes are called out in the UI. */
export function isApexDomain(host: string): boolean {
  return host.split(".").length === 2;
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

export function dnsRecordsForDomain(host: string, pagesHost: string): DnsRecord[] {
  if (isApexDomain(host)) {
    return [
      ...GITHUB_PAGES_IPV4.map((value) => ({ type: "A" as const, name: "@", value })),
      ...GITHUB_PAGES_IPV6.map((value) => ({ type: "AAAA" as const, name: "@", value })),
    ];
  }
  const name = host.split(".")[0] ?? host;
  return [{ type: "CNAME", name, value: `${pagesHost}.` }];
}

export function describePagesCertificate(state: string | null): string | null {
  if (!state) return null;
  if (state === "issued" || state === "uploaded" || state === "approved") {
    return "可以正常用 https 打开了";
  }
  if (state === "errored") return "还打不开：请先核对商家那边的解析是否已按表格添加";
  return "证书还在办理，过几分钟再试";
}

function splitOwnerRepo(siteRepo: string): { owner: string; repo: string } {
  const [owner, repo] = siteRepo.split("/");
  return { owner: owner ?? "", repo: repo ?? "" };
}
