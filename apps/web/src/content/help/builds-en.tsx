import { Link } from "@/i18n/navigation";

export function BuildsEn() {
  return (
    <>
      <p className="mt-4 leading-relaxed text-neutral-500">
        The top bar “Got the data / building from the data repo and pushing to the site repo” means this
        change is already in the private data repo. GitHub Actions is compiling and pushing to the public
        site repo — it is not stuck in the browser. You can close the tab and write the next post.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Can I leave?</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Yes. After a successful save, the files are already in the private data repo. The cloud workflow
          compiles on its own, then pushes to the public site repo. The progress line in the admin is only
          this page asking GitHub how far it got. Closing the page does not stop the build.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What if I save again?</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          It will not queue behind the last run, and two machines will not compile the same site at once. A
          new push <strong>cancels</strong> the in-flight run and keeps only the latest. Saving several
          times in a row is usually fine; the middle runs show up under “Recent builds” on the dashboard as
          “Cancelled.”
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">How long?</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Most sites take 60–120 seconds. The first build or a theme switch can take longer. The dashboard
          shows recent runs; you can also tap “View on GitHub” in the status bar.
        </p>
      </section>

      <p className="mt-10 text-sm text-neutral-500">
        Saving a draft also triggers a build, but that post never appears on the public site. See{" "}
        <Link href="/help/drafts-and-builds" className="underline hover:text-neutral-800">
          Scratch, drafts, and published
        </Link>
        .
      </p>
    </>
  );
}
