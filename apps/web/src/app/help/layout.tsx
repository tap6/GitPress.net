import Link from "next/link";
import type { ReactNode } from "react";

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Git<span className="text-gp-brand">Press</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-neutral-500">
          <Link href="/help" className="hover:text-neutral-900">
            帮助
          </Link>
          <Link href="/" className="hover:text-neutral-900">
            返回首页
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-20">{children}</main>
    </div>
  );
}
