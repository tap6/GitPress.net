"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HelpHeaderNav() {
  const pathname = usePathname();
  const onIndex = pathname === "/help";

  return (
    <div className="flex items-center gap-4 text-sm text-neutral-500">
      {!onIndex ? (
        <Link href="/help" className="hover:text-neutral-900">
          全部帮助
        </Link>
      ) : null}
      <Link href="/" className="hover:text-neutral-900">
        返回首页
      </Link>
    </div>
  );
}
