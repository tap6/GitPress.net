"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

export type HostingKind = "pages" | "vercel" | "cloudflare" | "other";

export const hostingCode =
  "rounded bg-black/[0.06] px-1 py-px font-mono text-[0.9em] text-neutral-800";
export const hostingMarkAmber = "rounded bg-amber-200 px-1 py-px font-medium text-amber-950";
export const hostingMarkSky = "rounded bg-sky-200 px-1 py-px font-medium text-sky-950";

export function isHostingKind(value: string | null | undefined): value is HostingKind {
  return value === "pages" || value === "vercel" || value === "cloudflare" || value === "other";
}

export function useHostingKindHash(defaultKind: HostingKind = "pages") {
  const [host, setHost] = useState<HostingKind>(defaultKind);

  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, "");
    if (isHostingKind(fromHash)) setHost(fromHash);
  }, []);

  function select(next: HostingKind) {
    setHost(next);
    const url = new URL(window.location.href);
    url.hash = next;
    window.history.replaceState(null, "", url);
  }

  return { host, select };
}

export function HostingOptionButtons({
  value,
  onChange,
  label,
}: {
  value: HostingKind;
  onChange: (next: HostingKind) => void;
  label?: string;
}) {
  const t = useTranslations("hosting");
  const options: { id: HostingKind; label: string; badge?: string }[] = [
    { id: "pages", label: "GitHub Pages", badge: t("defaultBadge") },
    { id: "vercel", label: "Vercel" },
    { id: "cloudflare", label: "Cloudflare" },
    { id: "other", label: t("other") },
  ];

  return (
    <div role="radiogroup" aria-label={label ?? t("method")} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.id)}
            className={
              selected
                ? "rounded-lg border-2 border-sky-500 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-950"
                : "rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50"
            }
          >
            {opt.label}
            {opt.badge ? (
              <span
                className={
                  selected
                    ? "ml-1.5 text-[10px] font-normal text-sky-700"
                    : "ml-1.5 text-[10px] font-normal text-neutral-400"
                }
              >
                {opt.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function Callout({
  tone,
  title,
  children,
}: {
  tone: "amber" | "sky" | "rose" | "emerald";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    sky: "border-sky-200 bg-sky-50 text-sky-950",
    rose: "border-rose-200 bg-rose-50 text-rose-950",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${styles[tone]}`}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}

export function DnsTable({ rows }: { rows: { type: string; name: string; value: string }[] }) {
  const t = useTranslations("hosting");
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-500">
          <tr>
            <th className="px-3 py-2 font-medium">{t("type")}</th>
            <th className="px-3 py-2 font-medium">{t("hostRecord")}</th>
            <th className="px-3 py-2 font-medium">{t("value")}</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs text-neutral-800">
          {rows.map((row) => (
            <tr key={`${row.type}-${row.name}-${row.value}`} className="border-t border-neutral-100">
              <td className="px-3 py-2">{row.type}</td>
              <td className="px-3 py-2">{row.name}</td>
              <td className="break-all px-3 py-2">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StepList({ children }: { children: ReactNode }) {
  return <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-neutral-700">{children}</ol>;
}

export function RepoMention({ siteRepo, fallback }: { siteRepo?: string; fallback: string }) {
  if (siteRepo) {
    return (
      <a
        href={`https://github.com/${siteRepo}`}
        target="_blank"
        rel="noreferrer"
        className="break-all font-medium text-wp-accent hover:underline"
      >
        {siteRepo}
      </a>
    );
  }
  return <span className="font-medium text-neutral-800">{fallback}</span>;
}
