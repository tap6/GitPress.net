import { Link } from "@/i18n/navigation";

export function ImportThemeEn() {
  return (
    <>
      <p className="mt-4 text-neutral-500 leading-relaxed">
        This is not WordPress’s “upload a zip and unzip it on the server.” Theme source for GitPress stays
        on GitHub; your site only remembers which repo and which version. The code is fetched by GitHub
        Actions on each build.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Where is the theme installed?</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          <strong>Not on GitPress.net’s servers</strong>, and not copied into your posts repo. The private
          data repo’s <code className="rounded bg-neutral-100 px-1">gitpress.json</code> only stores a
          pointer, for example:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100">
          {`"theme": {
  "name": "classic",
  "source": "builtin",
  "ref": "v1",
  "config": { "showAvatar": true }
}`}
        </pre>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Built-in themes have <code className="rounded bg-neutral-100 px-1">source</code>{" "}
          <code className="rounded bg-neutral-100 px-1">builtin</code>. They actually come from the official
          public repo{" "}
          <a
            href="https://github.com/tap6/gitpress"
            className="underline hover:text-neutral-800"
            target="_blank"
            rel="noreferrer"
          >
            tap6/gitpress
          </a>{" "}
          under <code className="rounded bg-neutral-100 px-1">themes/theme-name/</code>, pinned to tag{" "}
          <code className="rounded bg-neutral-100 px-1">v1</code>. An imported theme is written as{" "}
          <code className="rounded bg-neutral-100 px-1">github:owner/repo#branch-or-tag</code>.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What happens after “Add to my themes”</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
          <li>
            The admin first fetches that repo’s <code className="rounded bg-neutral-100 px-1">theme.json</code>{" "}
            and checks it is GitPress spec v1 with engine Astro.
          </li>
          <li>
            The repo URL is added to this site’s “my imports” list (on the GitPress control plane, not in
            your posts repo). The theme is not switched yet, and nothing is rebuilt.
          </li>
          <li>
            Only after you tap “Enable” on Appearance is the pointer written into the data repo{" "}
            <code className="rounded bg-neutral-100 px-1">gitpress.json</code>.
          </li>
          <li>That push on the data repo triggers GitHub Actions.</li>
          <li>
            The Action <code className="rounded bg-neutral-100 px-1">git clone</code>s the theme repo on
            GitHub’s build machine, mounts your posts and images, and runs{" "}
            <code className="rounded bg-neutral-100 px-1">astro build</code>.
          </li>
          <li>
            Only compiled HTML/CSS is pushed to the public site repo for GitHub Pages. Theme source does
            not stay in the site repo.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">The three form fields</h2>
        <dl className="mt-3 space-y-4 text-sm leading-relaxed text-neutral-600">
          <div>
            <dt className="font-medium text-neutral-800">GitHub repo</dt>
            <dd className="mt-1">
              <code className="rounded bg-neutral-100 px-1">owner/repo</code> works, or paste the browser
              URL, including pages with{" "}
              <code className="rounded bg-neutral-100 px-1">/tree/main/themes/xxx</code>.{" "}
              <strong>The repo must be public</strong> — the build machine clones anonymously and cannot
              read private repos.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-800">Subdirectory (optional)</dt>
            <dd className="mt-1">
              Leave empty if the whole repo is one theme. If it lives in something like{" "}
              <code className="rounded bg-neutral-100 px-1">themes/aurora</code>, fill that path. The root
              or that subdirectory must contain <code className="rounded bg-neutral-100 px-1">theme.json</code>.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-800">Branch / tag</dt>
            <dd className="mt-1">
              Prefer a pinned tag (such as <code className="rounded bg-neutral-100 px-1">v1</code>) over a
              branch that might be force-pushed. If you leave it empty and the URL has no branch, we try{" "}
              <code className="rounded bg-neutral-100 px-1">v1</code> by default.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What import does not do</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
          <li>It does not upload a zip or theme files to GitPress.net.</li>
          <li>It does not change your posts, images, or categories; switching a theme only changes presentation.</li>
          <li>
            It does not leave an editable copy of the theme in the public site repo. The next build clones
            the pinned version again.
          </li>
          <li>
            If the author later updates the theme on GitHub, your site still uses the ref written at enable
            time. To upgrade, change the URL in the list or the ref in{" "}
            <code className="rounded bg-neutral-100 px-1">gitpress.json</code>, then rebuild.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Common failures</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
          <li>The repo is private, or owner/repo is wrong.</li>
          <li>
            The branch/tag does not exist, or the subdirectory has no{" "}
            <code className="rounded bg-neutral-100 px-1">theme.json</code>.
          </li>
          <li>
            <code className="rounded bg-neutral-100 px-1">theme.json</code>{" "}
            <code className="rounded bg-neutral-100 px-1">specVersion</code> is not 1, or{" "}
            <code className="rounded bg-neutral-100 px-1">engine</code> is not{" "}
            <code className="rounded bg-neutral-100 px-1">astro</code>.
          </li>
          <li>
            The theme can be read, but Astro errors at build time (missing deps, paths that don’t match the
            mount contract). Then check the data repo’s Actions log.
          </li>
        </ul>
      </section>

      <p className="mt-10 text-sm text-neutral-500">
        Don’t have a theme yet?{" "}
        <Link href="/help/make-theme" className="underline hover:text-neutral-800">
          Make one with AI
        </Link>
        , or start with a built-in theme on Appearance. The spec is in{" "}
        <a
          href="https://github.com/tap6/gitpress/blob/main/spec/THEME_AUTHORING.md"
          className="underline hover:text-neutral-800"
          target="_blank"
          rel="noreferrer"
        >
          THEME_AUTHORING.md
        </a>
        .
      </p>
    </>
  );
}
