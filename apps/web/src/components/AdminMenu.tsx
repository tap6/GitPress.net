"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  parseSettingsSection,
  setSettingsSection,
  SETTINGS_SECTION_EVENT,
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "@/lib/settingsSections";

/** Hover 设置本身超过此时长，视为要点子项，展开子菜单。 */
const SETTINGS_HOVER_OPEN_MS = 300;
/** 离开设置+子菜单超过此时长，收起（仍在设置页时保持展开）。 */
const SETTINGS_HOVER_CLOSE_MS = 400;

function canHoverIntent(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M10 2 2 8v10h6v-6h4v6h6V8l-8-6z" />
    </svg>
  ),
  posts: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M4 3h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm2 3v2h8V6H6zm0 4v2h8v-2H6zm0 4v2h5v-2H6z" />
    </svg>
  ),
  pages: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M5 2h7l4 4v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm6 1.5V7h3.5" />
    </svg>
  ),
  media: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M3 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 10h12l-3.5-5-2.5 3.2L8.5 10 4 14zm3-5.5A1.5 1.5 0 1 0 7 5.5a1.5 1.5 0 0 0 0 3z" />
    </svg>
  ),
  categories: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M3 4a1 1 0 0 1 1-1h4l1.5 2H16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M3 5.5A1 1 0 0 1 4 4.5h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm1 4a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2H4z" />
    </svg>
  ),
  appearance: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M10 2a8 8 0 1 0 0 16c.9 0 1.5-.7 1.5-1.5 0-.4-.15-.75-.4-1-.24-.26-.38-.6-.38-1a1.5 1.5 0 0 1 1.5-1.5H14a4 4 0 0 0 4-4c0-3.9-3.6-7-8-7zM5.5 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm3-4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M11.5 2h-3l-.5 2.1a6 6 0 0 0-1.6.9L4.3 4.3 2.8 6.9l1.7 1.4a6 6 0 0 0 0 1.8L2.8 11.5l1.5 2.6 2.1-.7c.5.4 1 .7 1.6.9l.5 2.1h3l.5-2.1a6 6 0 0 0 1.6-.9l2.1.7 1.5-2.6-1.7-1.4a6 6 0 0 0 0-1.8l1.7-1.4-1.5-2.6-2.1.7a6 6 0 0 0-1.6-.9L11.5 2zM10 7.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M3 16h14v2H3v-2zm2-6h2v5H5V10zm4-4h2v9H9V6zm4 2h2v7h-2V8z" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M6.5 3.25a1.75 1.75 0 1 0-1.5 1.732v3.286A2.75 2.75 0 0 0 7.75 11h2.768a1.75 1.75 0 1 0 0-1.5H7.75A1.25 1.25 0 0 1 6.5 8.268V4.982A1.75 1.75 0 0 0 6.5 3.25zm7.25 7.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zM4.75 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z" />
    </svg>
  ),
};

export function adminNavHrefs(siteId: string): string[] {
  const base = `/sites/${siteId}`;
  return [
    base,
    `${base}/analytics`,
    `${base}/posts`,
    `${base}/pages`,
    `${base}/categories`,
    `${base}/menu`,
    `${base}/media`,
    `${base}/appearance`,
    `${base}/settings`,
  ];
}

export function AdminMenu({ siteId }: { siteId: string }) {
  const pathname = usePathname();
  const base = `/sites/${siteId}`;
  const settingsHref = `${base}/settings`;
  const onSettings = pathname === settingsHref;
  const [settingsSection, setSection] = useState<SettingsSectionId>("all");
  const [hoverOpen, setHoverOpen] = useState(false);
  const openTimer = useRef<number>(0);
  const closeTimer = useRef<number>(0);
  const settingsExpanded = onSettings || hoverOpen;

  const clearHoverTimers = () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
    openTimer.current = 0;
    closeTimer.current = 0;
  };

  useEffect(() => {
    setHoverOpen(false);
    clearHoverTimers();
  }, [pathname]);

  useEffect(() => () => clearHoverTimers(), []);

  const onSettingsButtonEnter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    if (!canHoverIntent()) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = 0;
    if (onSettings || hoverOpen) return;
    window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => setHoverOpen(true), SETTINGS_HOVER_OPEN_MS);
  };

  const onSettingsGroupEnter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = 0;
  };

  const onSettingsGroupLeave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    window.clearTimeout(openTimer.current);
    openTimer.current = 0;
    if (onSettings) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setHoverOpen(false), SETTINGS_HOVER_CLOSE_MS);
  };

  useEffect(() => {
    const sync = () => setSection(parseSettingsSection(window.location.hash));
    sync();
    const onCustom = (event: Event) => {
      const id = (event as CustomEvent<{ id: SettingsSectionId }>).detail?.id;
      if (id) setSection(id);
    };
    window.addEventListener(SETTINGS_SECTION_EVENT, onCustom);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener(SETTINGS_SECTION_EVENT, onCustom);
      window.removeEventListener("popstate", sync);
    };
  }, [pathname]);

  const items = [
    { href: base, key: "dashboard", label: "仪表盘", exact: true },
    { href: `${base}/analytics`, key: "analytics", label: "统计" },
    { href: `${base}/posts`, key: "posts", label: "文章" },
    { href: `${base}/pages`, key: "pages", label: "页面" },
    { href: `${base}/categories`, key: "categories", label: "分类" },
    { href: `${base}/menu`, key: "menu", label: "菜单" },
    { href: `${base}/media`, key: "media", label: "媒体" },
    { href: `${base}/appearance`, key: "appearance", label: "外观" },
    { href: settingsHref, key: "settings", label: "设置" },
    { href: `${base}/history`, key: "history", label: "Git 记录" },
  ];

  return (
    <nav className="mt-2">
      {items.map((item) => {
        const isSettings = item.key === "settings";
        const active = isSettings
          ? onSettings
          : item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <div
            key={item.key}
            onPointerEnter={isSettings ? onSettingsGroupEnter : undefined}
            onPointerLeave={isSettings ? onSettingsGroupLeave : undefined}
          >
            <Link
              href={item.href}
              prefetch
              scroll={!isSettings}
              aria-expanded={isSettings ? settingsExpanded : undefined}
              aria-controls={isSettings ? "admin-settings-submenu" : undefined}
              onPointerEnter={isSettings ? onSettingsButtonEnter : undefined}
              onClick={(event) => {
                if (isSettings && onSettings) {
                  event.preventDefault();
                  setSettingsSection("all");
                }
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition ${
                active && !isSettings
                  ? "bg-wp-accent text-white"
                  : active && isSettings && settingsSection === "all"
                    ? "bg-wp-accent text-white"
                    : active && isSettings
                      ? "bg-black/25 text-white"
                      : "text-wp-sidebar-text hover:bg-wp-base-dark hover:text-[#72aee6]"
              }`}
            >
              {ICONS[item.key]}
              {item.label}
            </Link>
            {isSettings && (
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                  settingsExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    id="admin-settings-submenu"
                    className="mb-1 bg-black/20 py-1"
                    role="group"
                    aria-label="设置分组"
                    aria-hidden={!settingsExpanded}
                    inert={!settingsExpanded || undefined}
                  >
                    {SETTINGS_SECTIONS.map((section) => {
                      const current = onSettings && settingsSection === section.id;
                      return (
                        <Link
                          key={section.id}
                          href={`${settingsHref}#${section.id}`}
                          prefetch={false}
                          scroll={false}
                          tabIndex={settingsExpanded ? undefined : -1}
                          onClick={(event) => {
                            if (onSettings) {
                              event.preventDefault();
                              setSettingsSection(section.id);
                            }
                          }}
                          className={`block py-1.5 pl-[2.35rem] pr-3 text-[12px] transition ${
                            current
                              ? "bg-wp-accent text-white"
                              : "text-wp-sidebar-text hover:bg-wp-base-dark hover:text-[#72aee6]"
                          }`}
                        >
                          {section.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
