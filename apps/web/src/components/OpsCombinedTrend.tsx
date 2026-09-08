"use client";

import { useState } from "react";

type DayCount = { day: string; n: number };

type DayRow = {
  day: string;
  users: number;
  installations: number;
  sites: number;
};

const TREND_CHART_PX = 144;

function barHeightPx(n: number, max: number): number {
  if (n <= 0) return 0;
  return Math.max(8, Math.round((n / max) * TREND_CHART_PX));
}

function clampTipX(x: number): number {
  if (typeof window === "undefined") return x;
  return Math.min(window.innerWidth - 16, Math.max(16, x));
}

function daySummary(
  row: DayRow,
  labels: { users: string; installations: string; sites: string },
): string {
  return `${row.day}  ${labels.users} ${row.users} · ${labels.installations} ${row.installations} · ${labels.sites} ${row.sites}`;
}

export function OpsCombinedTrend({
  title,
  lead,
  utcHint,
  empty,
  hoverHint,
  users,
  installations,
  sites,
  labels,
}: {
  title: string;
  lead: string;
  utcHint: string;
  empty: string;
  hoverHint: string;
  users: DayCount[];
  installations: DayCount[];
  sites: DayCount[];
  labels: { users: string; installations: string; sites: string };
}) {
  const days = users.map((row, index) => ({
    day: row.day,
    users: row.n,
    installations: installations[index]?.n ?? 0,
    sites: sites[index]?.n ?? 0,
  }));
  const max = Math.max(0, ...days.flatMap((row) => [row.users, row.installations, row.sites]));
  const first = days[0]?.day;
  const last = days[days.length - 1]?.day;
  const scale = Math.max(1, max);
  const [hover, setHover] = useState<{ row: DayRow; x: number; y: number } | null>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-xs text-slate-400">{lead}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-ops-accent" />
          {labels.users}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-sky-700" />
          {labels.installations}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-teal-900" />
          {labels.sites}
        </span>
      </div>
      {max === 0 ? (
        <p className="mt-6 text-sm text-slate-400">{empty}</p>
      ) : (
        <>
          <p className="mt-3 min-h-[1.25rem] text-sm tabular-nums text-slate-800">
            {hover ? daySummary(hover.row, labels) : hoverHint}
          </p>
          <div className="mt-2 overflow-x-auto">
            <div className="flex min-w-[40rem] items-end gap-px" style={{ height: TREND_CHART_PX }}>
              {days.map((row) => {
                const active = hover?.row.day === row.day;
                return (
                  <div
                    key={row.day}
                    className={`flex h-full min-w-0 flex-1 cursor-pointer items-end justify-center gap-px rounded-t ${
                      active ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                    onMouseEnter={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      setHover({
                        row,
                        x: clampTipX(rect.left + rect.width / 2),
                        y: rect.top,
                      });
                    }}
                    onMouseMove={(event) => {
                      setHover({
                        row,
                        x: clampTipX(event.clientX),
                        y: event.currentTarget.getBoundingClientRect().top,
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                    onFocus={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      setHover({
                        row,
                        x: clampTipX(rect.left + rect.width / 2),
                        y: rect.top,
                      });
                    }}
                    onBlur={() => setHover(null)}
                    tabIndex={0}
                  >
                    <div
                      className="min-w-0 flex-1 rounded-t bg-ops-accent"
                      style={{ height: barHeightPx(row.users, scale) }}
                    />
                    <div
                      className="min-w-0 flex-1 rounded-t bg-sky-700"
                      style={{ height: barHeightPx(row.installations, scale) }}
                    />
                    <div
                      className="min-w-0 flex-1 rounded-t bg-teal-900"
                      style={{ height: barHeightPx(row.sites, scale) }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {hover ? (
            <div
              role="tooltip"
              className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-md bg-slate-900 px-2.5 py-1.5 text-xs leading-5 text-white shadow-lg"
              style={{ left: hover.x, top: hover.y - 8 }}
            >
              <p className="font-medium">{hover.row.day}</p>
              <p>
                {labels.users} {hover.row.users}
              </p>
              <p>
                {labels.installations} {hover.row.installations}
              </p>
              <p>
                {labels.sites} {hover.row.sites}
              </p>
            </div>
          ) : null}
        </>
      )}
      <p className="mt-2 text-[11px] text-slate-400">
        {first && last ? `${first} → ${last}` : null} · {utcHint}
      </p>
    </div>
  );
}
