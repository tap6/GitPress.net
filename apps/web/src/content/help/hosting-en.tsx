import type { ReactNode } from "react";
import { GITHUB_PAGES_IPV4, GITHUB_PAGES_IPV6 } from "@/lib/customDomain";
import {
  Callout,
  DnsTable,
  RepoMention,
  StepList,
  hostingCode as code,
  hostingMarkAmber as markAmber,
  hostingMarkSky as markSky,
  type HostingKind,
} from "@/components/HostingGuideUi";

export function HostingWhyNotes() {
  return (
    <div className="space-y-3">
      <Callout tone="amber" title="① Tell GitPress the new address first">
        Links, images, and stylesheet paths are <strong>written in at compile time</strong>. If you open the
        site at <mark className={markAmber}>example.com</mark>, that is the address to save in settings
        (same for subdomains: fill the name visitors actually open). Change DNS only and skip this step:
        the page may load, but images and CSS still point at the old github.io URL.
      </Callout>
      <Callout tone="sky" title="② Add the domain at the host">
        Compiled pages live in the public <mark className={markSky}>site repo</mark> (not the one ending in{" "}
        <code className={code}>-data</code>). Whichever static host you use, add the domain in that host’s
        dashboard. GitPress does not manage Cloudflare or Vercel DNS for you. Use the buttons below for the
        matching steps.
      </Callout>
    </div>
  );
}

export function DomainKindNotes() {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">Address you want</th>
              <th className="px-3 py-2 font-medium">What it’s called</th>
              <th className="px-3 py-2 font-medium">Fill in settings</th>
            </tr>
          </thead>
          <tbody className="text-neutral-700">
            <tr className="border-t border-neutral-100 bg-emerald-50/70">
              <td className="px-3 py-2 font-mono text-xs">example.com</td>
              <td className="px-3 py-2">
                <span className="font-medium text-emerald-900">Apex domain (recommended)</span>
                <span className="mt-0.5 block text-xs text-neutral-500">Use the name you bought as the site URL</span>
              </td>
              <td className="px-3 py-2 font-mono text-xs">example.com</td>
            </tr>
            <tr className="border-t border-neutral-100">
              <td className="px-3 py-2 font-mono text-xs">blog.example.com</td>
              <td className="px-3 py-2">
                Subdomain
                <span className="mt-0.5 block text-xs text-neutral-500">A label in front of the apex; www counts</span>
              </td>
              <td className="px-3 py-2 font-mono text-xs">blog.example.com</td>
            </tr>
            <tr className="border-t border-neutral-100">
              <td className="px-3 py-2 font-mono text-xs">docs.blog.example.com</td>
              <td className="px-3 py-2">
                Extra labels
                <span className="mt-0.5 block text-xs text-neutral-500">More prefixes; the steps are the same</span>
              </td>
              <td className="px-3 py-2 font-mono text-xs">docs.blog.example.com</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Callout tone="sky" title="Several sites: each gets its own apex">
        Site A uses <code className={code}>example.com</code>, site B uses{" "}
        <code className={code}>another.com</code>. On GitHub Pages the DNS <em>value</em> can be identical
        (both point at Pages). GitHub cares which <strong>site repo registered that name</strong>, not a
        repo name written into DNS. <mark className={markAmber}>Do not put the repo name in the record</mark>.
      </Callout>
    </div>
  );
}

function PagesDnsGuide() {
  const pagesTarget = "<github-username>.github.io";
  return (
    <div className="mt-3 space-y-5">
      <div>
        <p className="text-sm font-medium text-neutral-800">Apex domain (recommended)</p>
        <p className="mt-1 text-sm text-neutral-600">
          Host record <code className={code}>@</code>. Most DNS hosts <strong>do not allow</strong> a CNAME
          on the apex; use A / AAAA pointing at GitHub Pages:
        </p>
        <div className="mt-2">
          <DnsTable
            rows={[
              ...GITHUB_PAGES_IPV4.map((value) => ({ type: "A", name: "@", value })),
              ...GITHUB_PAGES_IPV6.map((value) => ({ type: "AAAA", name: "@", value })),
            ]}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-800">Subdomains</p>
        <p className="mt-1 text-sm text-neutral-600">
          One CNAME is enough. Host record is the prefix(es) before the apex; value is{" "}
          <code className={code}>{pagesTarget}</code>,{" "}
          <mark className={markAmber}>without the repo name</mark>.
        </p>
        <div className="mt-2">
          <DnsTable
            rows={[
              { type: "CNAME", name: "blog", value: pagesTarget },
              { type: "CNAME", name: "www", value: pagesTarget },
              { type: "CNAME", name: "docs.blog", value: pagesTarget },
            ]}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          That is <code className={code}>blog.example.com</code>, <code className={code}>www.example.com</code>,{" "}
          <code className={code}>docs.blog.example.com</code>. Check with{" "}
          <code className={code}>dig +short CNAME blog.example.com</code>
        </p>
      </div>
    </div>
  );
}

export function HostingSteps({
  host,
  variant,
  siteRepo,
  pagesDns,
}: {
  host: HostingKind;
  variant: "help" | "settings";
  siteRepo?: string;
  pagesDns?: ReactNode;
}) {
  const repoLink = <RepoMention siteRepo={siteRepo} fallback="site repo" />;
  const inSettings = variant === "settings";

  if (host === "pages") {
    return (
      <div>
        <p className="text-sm text-neutral-500">
          Keep using the GitHub Pages host created with the site. GitPress can register the domain with GitHub for you.
        </p>
        <StepList>
          {inSettings ? (
            <li>
              Fill the visitor URL (most people use <code className={code}>example.com</code>) and save. We
              register it with GitHub Pages and trigger a rebuild.
            </li>
          ) : (
            <li>
              Admin → Settings → Site URL, choose <strong>GitHub Pages</strong>, fill the visitor URL (most
              people use <code className={code}>example.com</code>), and save.
            </li>
          )}
          <li>Add records at your DNS host using the table. Apex and subdomain records differ.</li>
        </StepList>
        {pagesDns ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-neutral-600">This table is generated from the domain already registered.</p>
            {pagesDns}
          </div>
        ) : (
          <PagesDnsGuide />
        )}
        <div className="mt-3">
          <Callout tone="amber" title="Cloudflare must be DNS only (grey cloud)">
            If the zone is on Cloudflare, records that point at Pages must be{" "}
            <mark className={markAmber}>DNS only (grey cloud)</mark>. With the orange proxy on, GitHub cannot
            issue a certificate.
          </Callout>
        </div>
      </div>
    );
  }

  if (host === "vercel") {
    return (
      <div>
        <p className="text-sm text-neutral-500">
          Point the same static files at Vercel and add the domain in the Vercel dashboard.
        </p>
        <StepList>
          <li>
            In Vercel, import the public {repoLink}.{" "}
            <mark className={markAmber}>Do not import the -data repo</mark> — that is the private post store.
          </li>
          <li>
            Framework: Other. Leave Build Command empty. Output Directory: <code className={code}>.</code>.
            The repo already contains HTML; <mark className={markSky}>do not run another build</mark>.
          </li>
          <li>
            Project Settings → Domains: add your domain. For the apex, use the ALIAS / A records Vercel
            gives you; subdomains are usually a CNAME to{" "}
            <code className={code}>cname.vercel-dns.com</code>.
          </li>
          {inSettings ? (
            <li>Back on this page, save the same visitor URL. Saving unregisters the domain from GitHub Pages.</li>
          ) : (
            <li>
              In GitPress settings, choose <strong>Vercel</strong>, fill the same URL, and save.
            </li>
          )}
        </StepList>
        <Callout tone="rose" title="Don’t hang it on two hosts">
          The same domain cannot point at Pages and Vercel at once. Choosing Vercel in GitPress and saving
          unregisters Pages. You can also unregister first, then add the domain in Vercel.
        </Callout>
      </div>
    );
  }

  if (host === "cloudflare") {
    return (
      <div>
        <p className="text-sm text-neutral-500">
          Use Cloudflare Pages. Certificates and DNS are handled by Cloudflare.
        </p>
        <StepList>
          <li>
            Cloudflare Dashboard → Workers &amp; Pages, connect {repoLink}. Turn the build off as well (or
            set the output directory to the repo root).
          </li>
          <li>
            Custom domains: apex, subdomain, or extra labels are all fine. Use the records Cloudflare
            generates. The orange proxy can stay on here; Cloudflare issues the certificate.
          </li>
          {inSettings ? (
            <li>
              Back on this page, save the same visitor URL. Do not choose GitHub Pages; saving unregisters
              Pages.
            </li>
          ) : (
            <li>
              In GitPress settings, choose <strong>Cloudflare</strong>, fill the same URL, and save.
            </li>
          )}
        </StepList>
        <Callout tone="rose" title="Don’t hang it on two hosts">
          Cloudflare can proxy; GitHub Pages cannot. Keep one hostname on one host. Saving Cloudflare
          unregisters Pages.
        </Callout>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-neutral-500">
        Netlify, your own Nginx, object storage plus a CDN — all fine. Same rule: the host that serves the
        static files owns the domain.
      </p>
      <StepList>
        <li>Deploy {repoLink} to your static host (again, not the -data repo).</li>
        <li>Follow that host’s docs to add the domain, write DNS, and wait for a certificate.</li>
        {inSettings ? (
          <li>Back on this page, save the full URL visitors will open.</li>
        ) : (
          <li>
            In GitPress settings, choose <strong>Other</strong>, fill the same URL, and save.
          </li>
        )}
      </StepList>
    </div>
  );
}

export function HostingPitfalls() {
  return (
    <div className="space-y-3">
      <Callout tone="amber" title="You changed DNS but not the visitor URL">
        The page opens, but assets still point at <code className={code}>/repo-name/...</code>. Go back to
        settings, save the domain, and wait for that build to finish.
      </Callout>
      <Callout tone="rose" title="Apex set as a CNAME">
        Most DNS hosts do not allow a CNAME on <code className={code}>@</code>. Use A / AAAA for the apex;
        CNAME is for subdomains.
      </Callout>
      <Callout tone="rose" title="Pages and another host fighting over the same name">
        Unregister Pages in settings first, then add the domain on Vercel / Cloudflare. Two GitPress sites
        should not register the same domain either.
      </Callout>
      <Callout tone="sky" title="DNS is correct but the site is still 404">
        The rebuild probably hasn’t finished. Check GitPress Build on the data repo’s Actions tab.
      </Callout>
    </div>
  );
}
