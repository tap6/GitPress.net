"use client";

import { useEffect, useState } from "react";

const ITEMS = [
  {
    id: "settings-general",
    label: "常规",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M4 4h12v2H4V4zm0 5h12v2H4V9zm0 5h8v2H4v-2z" />
      </svg>
    ),
  },
  {
    id: "settings-brand",
    label: "Logo 与头像",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M3 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 10h12l-3.5-5-2.5 3.2L8.5 10 4 14zm3-5.5A1.5 1.5 0 1 0 7 5.5a1.5 1.5 0 0 0 0 3z" />
      </svg>
    ),
  },
  {
    id: "account-ai",
    label: "账号 · 全局设置",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10 2.5 11.8 8h5.7l-4.6 3.4 1.8 5.5L10 13.6 5.3 16.9l1.8-5.5L2.5 8h5.7L10 2.5z" />
      </svg>
    ),
  },
  {
    id: "domain",
    label: "访问地址",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 1.5a6.5 6.5 0 0 1 6.4 5.5H12.4A12 12 0 0 0 10 3.5zm-1.6.2A10.5 10.5 0 0 0 7.6 9H3.6A6.5 6.5 0 0 1 8.4 3.7zM3.6 11h4A10.5 10.5 0 0 0 8.4 16.3 6.5 6.5 0 0 1 3.6 11zm6.4 5.5A12 12 0 0 0 12.4 11h4a6.5 6.5 0 0 1-6.4 5.5z" />
      </svg>
    ),
  },
  {
    id: "settings-hosting",
    label: "托管",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M5.5 4A4.5 4.5 0 0 1 14 5.2 3.5 3.5 0 0 1 16.5 12H6.2A4.5 4.5 0 0 1 5.5 4zM4 13h12v1.5H4V13zm0 2.5h12V17H4v-1.5z" />
      </svg>
    ),
  },
  {
    id: "settings-troubleshoot",
    label: "故障排查",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M13.2 2.3a1 1 0 0 1 1.4 0l3.1 3.1a1 1 0 0 1 0 1.4l-1.2 1.2-4.5-4.5 1.2-1.2zM10.8 4.7l4.5 4.5-8 8H2.8v-4.5l8-8z" />
      </svg>
    ),
  },
  {
    id: "settings-github",
    label: "GitHub App",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10 2a8 8 0 0 0-2.5 15.6c.4.07.5-.17.5-.38v-1.3c-2.2.48-2.7-1.06-2.7-1.06-.36-.9-.88-1.14-.88-1.14-.72-.5.05-.49.05-.49.8.06 1.22.83 1.22.83.71 1.22 1.86.87 2.3.66.07-.52.28-.87.5-1.07-1.76-.2-3.62-.88-3.62-3.93 0-.87.31-1.58.82-2.14-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82A7.6 7.6 0 0 1 10 6.4c.68 0 1.36.09 2 .26 1.52-1.04 2.19-.82 2.19-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.14 0 3.06-1.86 3.73-3.64 3.93.29.25.54.73.54 1.48v2.2c0 .21.1.46.51.38A8 8 0 0 0 10 2z" />
      </svg>
    ),
  },
] as const;

export function SettingsJumpNav() {
  const [active, setActive] = useState<string>(ITEMS[0].id);

  useEffect(() => {
    const nodes = ITEMS.map((item) => document.getElementById(item.id)).filter(
      (node): node is HTMLElement => node !== null,
    );
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.2, 0.5, 1] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="设置章节" className="flex flex-col items-end gap-0.5 rounded-xl border border-neutral-200 bg-white/95 p-1 shadow-md backdrop-blur">
      {ITEMS.map((item) => {
        const selected = active === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            title={item.label}
            aria-current={selected ? "true" : undefined}
            className={`group flex h-9 flex-row-reverse items-center overflow-hidden rounded-lg transition-[background,color] ${
              selected
                ? "bg-wp-accent text-white"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 focus-visible:bg-neutral-100 focus-visible:text-neutral-800"
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center" aria-hidden="true">
              {item.icon}
            </span>
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-medium opacity-0 transition-[max-width,opacity,padding] duration-200 group-hover:max-w-[9.5rem] group-hover:px-2.5 group-hover:opacity-100 group-focus-visible:max-w-[9.5rem] group-focus-visible:px-2.5 group-focus-visible:opacity-100">
              {item.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
