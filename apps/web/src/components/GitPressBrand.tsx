import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type BrandHref = "/" | "/dashboard" | "/ops";

interface Props {
  href?: BrandHref | null;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  suffix?: ReactNode;
}

/** Square mark + wordmark. Terracotta on “Press” is the product accent, not the PNG palette. */
export function GitPressBrand({
  href = "/",
  className = "",
  markClassName = "h-8 w-8",
  wordmarkClassName = "text-xl font-bold tracking-tight",
  suffix,
}: Props) {
  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-128.png"
        alt=""
        width={32}
        height={32}
        className={`rounded-md ${markClassName}`}
        aria-hidden
      />
      <span className={wordmarkClassName}>
        Git<span className="text-gp-brand">Press</span>
      </span>
      {suffix}
    </>
  );

  if (!href) {
    return <span className={`inline-flex items-center gap-2 ${className}`}>{inner}</span>;
  }

  return (
    <Link href={href} className={`inline-flex items-center gap-2 ${className}`}>
      {inner}
    </Link>
  );
}
