"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/ops", label: "总览", exact: true },
  { href: "/ops/users", label: "用户" },
  { href: "/ops/sites", label: "站点" },
  { href: "/ops/installations", label: "GitHub 安装" },
  { href: "/ops/themes", label: "主题商店" },
];

function navActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface Props {
  userName: string;
  children: React.ReactNode;
}

export function OpsShell({ userName, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 lg:flex-row">
      <div className="flex items-center justify-between gap-2 bg-ops-ink px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="-ml-1.5 rounded p-1.5 text-white hover:bg-white/10"
          aria-label="打开菜单"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M2 5h16v1.5H2V5zm0 4.25h16v1.5H2v-1.5zM2 13.5h16V15H2v-1.5z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <span className="min-w-0 flex-1 truncate text-center text-sm font-medium text-white">运营后台</span>
        <Link href="/dashboard" className="shrink-0 text-xs text-slate-300 hover:text-white">
          我的站点
        </Link>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 shrink-0 transform bg-ops-ink transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <Link href="/ops" className="text-sm font-bold text-white">
            Git<span className="text-gp-brand">Press</span>
            <span className="ml-2 rounded bg-ops-accent px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
              OPS
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded p-1 text-slate-400 hover:text-white lg:hidden"
            aria-label="关闭菜单"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 p-2 text-sm">
          {NAV.map((item) => {
            const active = navActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-2 ${
                  active ? "bg-white/10 font-medium text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 border-t border-white/10 px-4 py-3">
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white">
            ← 我的站点
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden items-center justify-between gap-3 bg-ops-ink px-5 py-1.5 text-[13px] text-slate-300 lg:flex">
          <span>平台运营 · 只读用户内容,不进入站长后台</span>
          <span className="shrink-0">你好,{userName}</span>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
