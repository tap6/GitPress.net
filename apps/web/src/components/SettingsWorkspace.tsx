"use client";

import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import {
  parseSettingsSection,
  setSettingsSection,
  settingsSectionLabel,
  SETTINGS_SECTION_EVENT,
  SETTINGS_SECTIONS,
  type SettingsPanelId,
  type SettingsSectionId,
} from "@/lib/settingsSections";

const SettingsSectionContext = createContext<SettingsSectionId>("all");

interface WorkspaceProps {
  /** e.g. domain save redirect should open 访问地址 even without a hash. */
  initialSection?: SettingsPanelId;
  children: ReactNode;
}

export function SettingsWorkspace({ initialSection, children }: WorkspaceProps) {
  const [section, setSection] = useState<SettingsSectionId>(initialSection ?? "all");

  useLayoutEffect(() => {
    const fromHash = parseSettingsSection(window.location.hash);
    const next = initialSection ?? fromHash;
    setSection(next);
    if (initialSection && parseSettingsSection(window.location.hash) !== initialSection) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${initialSection}`,
      );
    }
  }, [initialSection]);

  useLayoutEffect(() => {
    const onCustom = (event: Event) => {
      const id = (event as CustomEvent<{ id: SettingsSectionId }>).detail?.id;
      if (id) setSection(id);
    };
    const onPop = () => setSection(parseSettingsSection(window.location.hash));
    window.addEventListener(SETTINGS_SECTION_EVENT, onCustom);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener(SETTINGS_SECTION_EVENT, onCustom);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-normal text-neutral-800">
        设置
        {section !== "all" && (
          <span className="ml-2 text-base text-neutral-400">/ {settingsSectionLabel(section)}</span>
        )}
      </h1>
      <div className="mt-3 flex flex-wrap gap-1.5 lg:hidden" role="tablist" aria-label="设置分组">
        <button
          type="button"
          role="tab"
          aria-selected={section === "all"}
          onClick={() => setSettingsSection("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            section === "all"
              ? "bg-wp-accent text-white"
              : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50"
          }`}
        >
          全部
        </button>
        {SETTINGS_SECTIONS.map((item) => {
          const active = item.id === section;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSettingsSection(item.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                active
                  ? "bg-wp-accent text-white"
                  : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <SettingsSectionContext.Provider value={section}>{children}</SettingsSectionContext.Provider>
    </div>
  );
}

export function SettingsPanel({
  id,
  children,
}: {
  id: SettingsPanelId;
  children: ReactNode;
}) {
  const section = useContext(SettingsSectionContext);
  const active = section === "all" || section === id;
  return (
    <div
      hidden={!active}
      role="tabpanel"
      aria-label={settingsSectionLabel(id)}
      className={active ? "mt-5 flex flex-col gap-5" : undefined}
      inert={!active || undefined}
    >
      {children}
    </div>
  );
}
