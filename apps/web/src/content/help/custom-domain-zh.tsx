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

export function CustomDomainZh() {
  const { host, select } = useHostingKindHash();

  return (
    <>
      <p className="mt-4 leading-relaxed text-neutral-600">
        多数人会把买来的 <strong className="font-medium text-neutral-800">一级域名</strong> 直接当网站地址，例如用{" "}
        <code className="rounded bg-neutral-100 px-1 font-mono text-[0.9em]">example.com</code> 打开站点 A、用{" "}
        <code className="rounded bg-neutral-100 px-1 font-mono text-[0.9em]">another.com</code> 打开站点 B。
        二级（<code className="rounded bg-neutral-100 px-1 font-mono text-[0.9em]">blog.example.com</code>
        ）和多级也可以，在设置里填访客实际打开的那个名字。
      </p>

      <div className="mt-6">
        <HostingWhyNotes />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">先想好用哪一级</h2>
        <p className="mt-2 text-sm text-neutral-500">推荐一级；二级、多级只是多几个前缀，步骤相同。</p>
        <div className="mt-4">
          <DomainKindNotes />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">选一种托管，看对应步骤</h2>
        <p className="mt-2 text-sm text-neutral-500">同一个域名不要同时指到两家。</p>
        <div className="mt-4">
          <HostingOptionButtons value={host} onChange={select} />
        </div>
        <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50/80 p-5">
          <HostingSteps host={host} variant="help" />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">常见坑</h2>
        <div className="mt-4">
          <HostingPitfalls />
        </div>
      </section>

      <p className="mt-10">
        <Link
          href="/dashboard"
          className="inline-block rounded-md bg-gp-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          打开后台
        </Link>
      </p>
    </>
  );
}
