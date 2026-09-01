export function AnalyticsEn() {
  return (
    <>
      <p className="mt-4 leading-relaxed text-neutral-500">
        GitPress has no built-in visitor stats, and it does not store page views in its own database. You
        connect a third party under Analytics in the sidebar; the numbers live in that vendor’s dashboard.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Where config lives</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          It is written to the private data repo’s{" "}
          <code className="rounded bg-neutral-100 px-1">gitpress.json</code>, same as the site name and
          comments. Not GitPress’s cloud database. If you turn off “include on the site,” the IDs you
          filled in stay; the next build just stops injecting the scripts.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">How to connect</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
          <li>Create a site or property at the vendor and copy the ID or snippet they give you.</li>
          <li>Back in GitPress, open Analytics in the sidebar, fill the matching card, and check “include on the site.”</li>
          <li>Optional: paste their dashboard URL into “board link.” After save, the top of this page can jump there in one tap.</li>
          <li>Save. If the public site’s scripts change, a build runs and takes about a minute.</li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What you can connect</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
          <li>
            <a href="https://analytics.google.com/" className="text-wp-accent hover:underline" target="_blank" rel="noreferrer">
              Google Analytics
            </a>
            : measurement ID, like <code className="rounded bg-neutral-100 px-1">G-xxxxxxxx</code>.
          </li>
          <li>
            <a href="https://clarity.microsoft.com/" className="text-wp-accent hover:underline" target="_blank" rel="noreferrer">
              Microsoft Clarity
            </a>
            : heatmaps and session replay; can run alongside traffic stats.
          </li>
          <li>
            <a href="https://dash.cloudflare.com/" className="text-wp-accent hover:underline" target="_blank" rel="noreferrer">
              Cloudflare Web Analytics
            </a>
            : beacon token. Reporting from readers in mainland China may be incomplete.
          </li>
          <li>
            <a href="https://tongji.baidu.com/" className="text-wp-accent hover:underline" target="_blank" rel="noreferrer">
              Baidu Tongji
            </a>
            : copy the site ID after hm.js.
          </li>
          <li>
            <a href="https://cloud.umami.is/" className="text-wp-accent hover:underline" target="_blank" rel="noreferrer">
              Umami
            </a>
            : Cloud or self-hosted. Website ID is a UUID; self-hosted needs a custom script URL.
          </li>
          <li>
            <a href="https://www.51.la/" className="text-wp-accent hover:underline" target="_blank" rel="noreferrer">
              51.LA
            </a>
            : the stats id from their dashboard.
          </li>
          <li>Custom snippets can be added more than once. Plausible, GoatCounter, and other scripts go here.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">If GitPress is down</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Analytics scripts on your already-published site report to the third party on their own. After
          you turn analytics off and rebuild, the site stops calling those vendors. gitpress.net itself
          does not count visits; if it is down, the live blog still opens.
        </p>
      </section>
    </>
  );
}
