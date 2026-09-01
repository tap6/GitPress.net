import { Link } from "@/i18n/navigation";
import {
  BUILD_ACTION_REPO,
  GITPRESS_REPO,
  HELP_BODY as BODY,
  HELP_BODY_MUTED as BODY_MUTED,
  Mark,
  PLATFORM_REPO,
  RepoCard,
} from "@/content/help/shared";

export function WhatIsEn() {
  return (
    <>
      <p className={`mt-4 ${BODY}`}>
        GitPress is a <strong className="font-semibold text-neutral-900">blog admin</strong>. You sign in
        and write the way you would in WordPress; the prose lives in your own GitHub repo; after you save,
        it is compiled into a static site on GitHub Pages. gitpress.net is only the remote control —
        readers are not hitting our servers.
      </p>
      <p className={`mt-3 ${BODY}`}>
        It is not another static site generator. Tools like Hugo and VitePress are something you install
        and run from the command line. GitPress puts writing in a web admin and building in your GitHub
        Actions.
      </p>

      <p className="mt-6 rounded-lg bg-neutral-900 px-4 py-3 text-sm leading-relaxed text-white">
        Just want a site?{" "}
        <Link href="/login" className="font-medium underline decoration-white/50 underline-offset-2 hover:decoration-white">
          Start by creating your blog
        </Link>
        . To understand whether the platform can hold your drafts hostage, read on.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Who it’s for</h2>
        <ul className={`mt-3 list-disc space-y-1.5 pl-5 ${BODY}`}>
          <li>You want a personal blog without renewing a server every year, migrating a database, or re-pointing DNS.</li>
          <li>You don’t want posts sitting in a platform’s database, needing an “export request” if you leave.</li>
          <li>A GitHub account is enough; you don’t have to set up Hugo or VitePress yourself.</li>
        </ul>
      </section>

      <section className="mt-10" id="compare">
        <h2 className="text-lg font-semibold">How it differs from other tools</h2>
        <ul className={`mt-3 space-y-3 ${BODY}`}>
          <li>
            <strong className="font-semibold text-neutral-900">WordPress:</strong> The admin feel is similar.
            The difference is that neither the drafts nor the pages readers see live on our servers — they
            live on your GitHub.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Hugo / VitePress:</strong> Both compile
            Markdown into a static site. They are generators you run locally or in CI. GitPress gives you a
            web admin; the generator runs in Actions on your repo.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Typical blog platforms:</strong> When you
            leave, you take the repo, not an export you had to request. If the platform shuts down, you lose
            this admin, not the articles.
          </li>
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-6 sm:px-6">
        <h2 className="text-base font-semibold text-neutral-900">Why this project exists</h2>
        <div className={`mt-4 space-y-3 ${BODY}`}>
          <p>
            I used to have a <strong className="font-semibold text-neutral-900">WordPress</strong> personal
            blog for about five or six years. <Mark>Every year I had to buy a new server</Mark> (new
            purchases were much cheaper), migrate, then re-point DNS. Exhausting, and it kept happening.
          </p>
          <p>
            Once I forgot to renew the server and didn’t migrate.{" "}
            <Mark>Several years of blog data were gone.</Mark> Without a more lasting fix, that exhausting,
            possibly repeating disaster would happen again. So I went looking.
          </p>
          <p>
            <strong className="font-semibold text-neutral-900">Hugo</strong> and a whole line of{" "}
            <strong className="font-semibold text-neutral-900">SSGs</strong> (static site generators) can
            compile a site, but <Mark>the mental cost and the operational cost were both high.</Mark>
          </p>
          <p>
            Then I found <strong className="font-semibold text-neutral-900">Gridea</strong>. Data lived on
            the computer; I had to sit at the desk to write — <Mark>I couldn’t write from anywhere</Mark> —
            so I dropped it. They later shipped a web version, but it was paid, limited, and worse than the
            local one. The core hadn’t changed: <Mark>the articles still weren’t safe enough.</Mark>
          </p>
          <p>
            To solve this epic problem — and because the open-source tools on the market can already support
            a setup like this — I started on the architecture.{" "}
            <Mark>Designs like one blog, two repos.</Mark> There are more architectural choices I won’t
            unpack here; if you want, fork the source repo and let an AI walk you through it.
          </p>
          <p className="text-neutral-600">
            The first version was written with <strong className="font-semibold text-neutral-900">Fable 5</strong>.
            Just the first AI plan run cost <Mark>200 yuan</Mark>. Honestly,{" "}
            <strong className="font-semibold text-neutral-900">Fable 5</strong> is expensive. After more
            rounds of features and fixes, we got to this version.
          </p>
        </div>
      </section>

      <p className={`mt-8 ${BODY}`}>
        So what you use every day is the admin. What actually holds the site up is the two repos on your
        GitHub, plus the public admin source, and the MIT-licensed themes and build tool. The admin is only
        a remote control.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What the three pieces do</h2>
        <p className={`mt-2 ${BODY_MUTED}`}>
          Three jobs: where the drafts live, how the blog looks, and who compiles after you hit save. You
          don’t need to read the repo READMEs first.
        </p>
        <div className="mt-4 space-y-3">
          <RepoCard
            featured
            label="Main repo · the site you click every day"
            name="tap6/GitPress.net"
            body="WordPress-style admin: sign in, create repos, write, save. We call the GitHub API for you; Postgres has no prose. Source is public (PolyForm Shield); you can self-host. If we shut down, you lose this admin, not the articles."
            href={PLATFORM_REPO}
            openLabel="Open on GitHub →"
          />
          <RepoCard
            label="How the blog looks"
            name="tap6/gitpress"
            body="Built-in themes, how post Markdown is written, what gitpress.json means. Switching themes or making your own follows this contract. The data-repo template lives here too."
            href={GITPRESS_REPO}
            openLabel="Open on GitHub →"
          />
          <RepoCard
            label="Who works after you hit save"
            name="tap6/build-action"
            body="Reads from your private data repo, compiles a static site, pushes to the public site repo. Runs on GitHub, not on gitpress.net machines."
            href={BUILD_ACTION_REPO}
            openLabel="Open on GitHub →"
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">If we shut down</h2>
        <p className={`mt-2 ${BODY}`}>
          This is not “export then migrate.” Prose, images, and drafts never entered our database — they
          were always in your private data repo; the HTML readers see is in your public site repo. Keep
          using the same gitpress theme and build-action on GitHub. If the platform is gone, you lose the
          remote control, not the drafts.
        </p>
        <p className={`mt-3 ${BODY}`}>
          What the control plane keeps and skips:{" "}
          <Link href="/privacy" className="text-neutral-900 underline hover:text-neutral-700">
            Privacy
          </Link>
          . To make a skin yourself:{" "}
          <Link href="/help/make-theme" className="text-neutral-900 underline hover:text-neutral-700">
            Make a theme with AI
          </Link>
          .
        </p>
      </section>
    </>
  );
}
