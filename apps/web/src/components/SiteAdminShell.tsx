"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AdminMenu } from "@/components/AdminMenu";
import { BuildStatusBar } from "@/components/BuildStatusBar";
import { RouteLoadingBar } from "@/components/RouteLoadingBar";

interface Props {
  siteId: string;
  siteName: string;
  siteUrl: string | null;
  dataRepo: string;
  userName: string;
  children: React.ReactNode;
}

/**
 * Responsive admin chrome shared by every `/sites/[siteId]/*` page. Below the
 * `lg` breakpoint the fixed sidebar becomes a slide-in drawer (triggered by a
 * hamburger button in a compact mobile top bar) so the whole admin — writing
 * included — is usable from a phone, without maintaining a separate mobile
 * UI/route tree.
 */
export function SiteAdminShell({ siteId, siteName, siteUrl, dataRepo, userName, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Tapping a nav link inside the drawer should close it once the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer overlay is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-wp-canvas lg:flex-row">
      {/* Compact top bar — mobile/tablet only. */}
      <div className="flex items-center justify-between gap-2 bg-wp-base px-4 py-3 lg:hidden">
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
        <span className="min-w-0 flex-1 truncate text-center text-sm font-medium text-white">
          {siteName}
        </span>
        <Link
          href="/dashboard"
          className="shrink-0 text-xs text-wp-sidebar-text hover:text-white"
        >
          全部站点
        </Link>
      </div>

      {/* Drawer overlay — mobile/tablet only, shown while the drawer is open. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: slide-in drawer below `lg`, static column at `lg` and up. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform bg-wp-base transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-40 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <Link href="/dashboard" className="text-sm font-bold text-white">
            Git<span className="text-gp-brand">Press</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded p-1 text-wp-sidebar-text hover:text-white lg:hidden"
            aria-label="关闭菜单"
          >
            ✕
          </button>
        </div>
        <AdminMenu siteId={siteId} />
        <div className="mt-6 border-t border-white/10 px-4 py-3">
          <Link href="/dashboard" className="text-xs text-wp-sidebar-text hover:text-white">
            ← 全部站点
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Admin bar — desktop only, the mobile top bar above covers this role on small screens. */}
        <div className="hidden items-center justify-between gap-3 bg-wp-base px-5 py-1.5 text-[13px] text-wp-sidebar-text lg:flex">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-white">{siteName}</span>
            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 hover:text-[#72aee6]"
              >
                访问站点 ↗
              </a>
            )}
          </div>
          <span className="shrink-0">你好,{userName}</span>
        </div>
        <Suspense fallback={null}>
          <RouteLoadingBar />
        </Suspense>
        <BuildStatusBar siteId={siteId} dataRepo={dataRepo} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
