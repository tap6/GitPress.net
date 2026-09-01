import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { HelpHeaderNav } from "@/components/HelpHeaderNav";

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Git<span className="text-gp-brand">Press</span>
        </Link>
        <HelpHeaderNav />
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-20">{children}</main>
    </div>
  );
}
