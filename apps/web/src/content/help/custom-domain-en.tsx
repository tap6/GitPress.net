"use client";

import { Link } from "@/i18n/navigation";
import {
  DomainKindNotes,
  HostingOptionButtons,
  HostingPitfalls,
  HostingSteps,
  HostingWhyNotes,
  useHostingKindHash,
} from "@/components/HostingGuide";

export function CustomDomainEn() {
  const { host, select } = useHostingKindHash();

  return (
    <>
      <p className="mt-4 leading-relaxed text-neutral-600">
        Most people point a purchased <strong className="font-medium text-neutral-800">apex domain</strong>{" "}
        at the site — for example open site A at{" "}
        <code className="rounded bg-neutral-100 px-1 font-mono text-[0.9em]">example.com</code> and site B at{" "}
        <code className="rounded bg-neutral-100 px-1 font-mono text-[0.9em]">another.com</code>. Subdomains
        (<code className="rounded bg-neutral-100 px-1 font-mono text-[0.9em]">blog.example.com</code>) and
        extra labels work too. In settings, fill the name visitors actually open.
      </p>

      <div className="mt-6">
        <HostingWhyNotes />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Pick a level first</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Apex is recommended; subdomains and extra labels are just more prefixes. The steps are the same.
        </p>
        <div className="mt-4">
          <DomainKindNotes />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Pick a host and follow its steps</h2>
        <p className="mt-2 text-sm text-neutral-500">Don’t point the same name at two hosts at once.</p>
        <div className="mt-4">
          <HostingOptionButtons value={host} onChange={select} />
        </div>
        <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50/80 p-5">
          <HostingSteps host={host} variant="help" />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Common pitfalls</h2>
        <div className="mt-4">
          <HostingPitfalls />
        </div>
      </section>

      <p className="mt-10">
        <Link
          href="/dashboard"
          className="inline-block rounded-md bg-gp-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Open the dashboard
        </Link>
      </p>
    </>
  );
}
