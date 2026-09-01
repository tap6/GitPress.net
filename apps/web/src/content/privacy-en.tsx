import { Link } from "@/i18n/navigation";
import {
  FlowCard,
  IconCloud,
  IconDoc,
  IconGlobe,
  IconImage,
  IconKey,
  IconLock,
  IconPages,
  IconPen,
  IconPlug,
  IconRepo,
  IconUser,
  KeepItem,
  SkipItem,
} from "@/content/privacy-shared";

export function PrivacyEn() {
  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gp-brand text-white shadow-sm">
          <IconLock />
        </span>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">Privacy</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Prose never enters our servers
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-neutral-600">
            GitPress.net is a cloud tool, not a content host. When you open the admin, the platform uses
            the GitHub App you authorized to{" "}
            <strong className="font-semibold text-neutral-800">read your repo</strong>; save{" "}
            <strong className="font-semibold text-neutral-800">writes back to the same repo</strong>. The
            only source of prose is your GitHub, not our Postgres.
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              We keep
            </span>
            <h2 className="text-lg font-semibold text-emerald-950">Control plane</h2>
          </div>
          <p className="mt-2 text-sm text-emerald-900/70">
            Enough to sign in and find your sites. Not a draft library.
          </p>
          <ul className="mt-5 space-y-3">
            <KeepItem
              icon={<IconUser />}
              title="Sign-in account"
              body="Email, display name, avatar. Auth needs them."
            />
            <KeepItem
              icon={<IconPlug />}
              title="GitHub App install mapping"
              body="So the admin can read and write repos on your behalf. Uninstall the App and this link breaks."
            />
            <KeepItem
              icon={<IconGlobe />}
              title="Site pointers"
              body="Site name, theme name, the two repo URLs, public URL, and similar metadata."
            />
            <KeepItem
              icon={<IconKey />}
              title="Optional: your own AI key"
              body="Stored only if you fill it in. Encrypted; the database never has plaintext."
            />
          </ul>
        </section>

        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gp-brand px-2.5 py-0.5 text-xs font-semibold text-white">
              We don’t store
            </span>
            <h2 className="text-lg font-semibold text-rose-950">Content</h2>
          </div>
          <p className="mt-2 text-sm text-rose-900/70">These live only on your GitHub. We have no second copy.</p>
          <ul className="mt-5 space-y-3">
            <SkipItem
              icon={<IconDoc />}
              title="Posts and pages"
              body="Markdown prose and drafts. Save writes them into the private data repo."
            />
            <SkipItem icon={<IconImage />} title="Media files" body="Images, video, and the like. Same data repo only." />
            <SkipItem
              icon={<IconPages />}
              title="Public-site HTML"
              body="On your site repo / Pages. Reader requests do not go through gitpress.net."
            />
            <SkipItem
              icon={<IconLock />}
              title="After you revoke access"
              body="Uninstall the GitHub App or delete the repo, and we can no longer read content."
            />
          </ul>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Where data goes</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Four steps. There is no “upload to GitPress, then we distribute it” hop.
        </p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FlowCard
            icon={<IconPen />}
            color="bg-gp-brand text-white"
            index={1}
            total={4}
            title="You write in the admin"
            body="The editor is on gitpress.net. The draft has not become “our data” yet."
          />
          <FlowCard
            icon={<IconCloud />}
            color="bg-sky-600 text-white"
            index={2}
            total={4}
            title="The platform calls the GitHub API"
            body="Opening the admin reads your repo; save writes back to the same repo."
          />
          <FlowCard
            icon={<IconRepo />}
            color="bg-emerald-600 text-white"
            index={3}
            total={4}
            title="Private data repo"
            body="Prose, media, and drafts live only here. This is the only source."
          />
          <FlowCard
            icon={<IconPages />}
            color="bg-violet-600 text-white"
            index={4}
            total={4}
            title="Public site repo / Pages"
            body="Actions compiles HTML. Readers do not go through gitpress.net."
          />
        </ol>
      </section>

      <aside className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
        <p className="font-semibold">About those few dozen seconds of admin cache</p>
        <p className="mt-2 text-amber-900/80">
          To open faster, we cache the list just read from GitHub at the edge for a few dozen seconds, and
          bust it as soon as you save. This is not a content library, and it cannot keep working after you
          revoke access.
        </p>
      </aside>

      <p className="mt-10 text-sm text-neutral-500">
        What the three pieces do, and what happens if we shut down:{" "}
        <Link href="/help/what-is-gitpress" className="underline hover:text-neutral-800">
          What is GitPress?
        </Link>
        .
      </p>
    </>
  );
}
