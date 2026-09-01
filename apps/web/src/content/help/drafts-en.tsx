import { Link } from "@/i18n/navigation";

export function DraftsEn() {
  return (
    <>
      <p className="mt-4 leading-relaxed text-neutral-500">
        “Doesn’t enter the build” is easy to hear as “won’t run a build.” What actually happens: a draft is
        written to GitHub and does trigger a build, but this post never appears on the public site.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Three states</h2>
        <dl className="mt-3 space-y-4 text-sm leading-relaxed text-neutral-600">
          <div>
            <dt className="font-medium text-neutral-800">Scratch (this browser)</dt>
            <dd className="mt-1">
              The editor autosaves here. Until you hit save, nothing goes to GitHub and no build runs.
              Switch computers or clear site data and it’s gone.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-800">Draft · not public</dt>
            <dd className="mt-1">
              After “Save to repo”, the post goes into the private data repo{" "}
              <code className="rounded bg-neutral-100 px-1">content/posts/</code>, with{" "}
              <code className="rounded bg-neutral-100 px-1">draft: true</code> in frontmatter. A build runs;
              the theme filters this post out. It is not on the public site, RSS, or nav.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-800">Published</dt>
            <dd className="mt-1">
              Also committed to the private repo and built. Posts whose date has arrived appear on the
              public site. Future-dated posts are still excluded at build time. The comparison is a single
              instant in the world (save records your timezone offset); public pages display in the site
              timezone.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What happens after you save</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
          <li>The admin commits Markdown to your private data repo.</li>
          <li>That push triggers a GitHub Actions build.</li>
          <li>The theme only includes posts that are published and whose date has arrived, and writes them into the public site repo.</li>
          <li>GitHub Pages (or your host) updates the public site.</li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Scheduled publishing</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Off by default. While off, you can’t pick a post date in the future. To schedule, turn on the
          check under Settings → Scheduled posts. If you can live with a bit more delay, pick a longer
          interval to save Actions minutes; for most single sites, every 2 hours is a good default. Sites
          under the same GitHub account share the free quota; if it would get too tight, we’ll ask you to
          confirm before save.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
          <li>Saving a post builds immediately; if the date hasn’t arrived, the public site still won’t show it.</li>
          <li>Once on, GitHub builds again on your interval. The post appears when a run happens after the date has passed.</li>
          <li>
            This is a check interval, not a timer aimed at the minute on the post. After the time, you wait
            at most one more interval; GitHub load can add a little more. Settings has a usage chart per
            interval, and you can estimate remaining minutes from how often you save. Typing doesn’t cost
            Actions.
          </li>
          <li>Changing the date only changes the post date; you don’t change settings again.</li>
          <li>
            Before turning it off, deal with published posts that aren’t due yet (set to now, convert to
            draft, or wait for them to go live).
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Pages have no draft</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Standalone pages like About appear on the public site as soon as you save. To write first and
          publish later, keep it as a post draft, or don’t add it to the menu yet.
        </p>
      </section>

      <p className="mt-10 text-sm text-neutral-500">
        Whether you can leave during a build, and what a second save does:{" "}
        <Link href="/help/builds" className="underline hover:text-neutral-800">
          How builds run
        </Link>
        .
      </p>
    </>
  );
}
