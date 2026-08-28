"use client";

import { useState } from "react";
import type { ActionsDayUsage } from "@/lib/github";

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const norm = value / pow;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * pow;
}

function formatMinutes(value: number): string {
  if (value === 0) return "0";
  if (value < 1) return value.toFixed(1);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function quotaTone(percent: number): { bar: string; text: string } {
  if (percent >= 90) return { bar: "bg-red-600", text: "text-red-700" };
  if (percent >= 70) return { bar: "bg-amber-500", text: "text-amber-800" };
  return { bar: "bg-wp-accent", text: "text-neutral-600" };
}

function QuotaBar({
  label,
  used,
  cap,
  hint,
}: {
  label: string;
  used: number;
  cap: number;
  hint: string;
}) {
  const percent = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
  const tone = quotaTone(percent);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-neutral-600">{label}</span>
        <span className={`tabular-nums ${tone.text}`}>
          {formatMinutes(used)} / {cap} 分钟
          <span className="ml-1.5 text-xs text-neutral-400">{percent.toFixed(percent < 1 ? 1 : 0)}%</span>
        </span>
      </div>
      <div
        className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-neutral-100"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-valuenow={Math.round(used)}
      >
        <div
          className={`h-full rounded-full ${tone.bar} transition-[width] duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-neutral-400">{hint}</p>
    </div>
  );
}

export function ActionsUsageChart({
  daily,
  siteMinutes,
  siteRunCount,
  accountMinutes,
  includedMinutes,
  quotaIsEstimate,
  periodLabel,
}: {
  daily: ActionsDayUsage[];
  siteMinutes: number;
  siteRunCount: number;
  accountMinutes: number | null;
  includedMinutes: number;
  quotaIsEstimate: boolean;
  periodLabel: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const peak = Math.max(...daily.map((day) => day.minutes), 0);
  const yMax = niceMax(peak);
  const hovered = active != null ? daily[active] : null;

  const width = 640;
  const height = 200;
  const pad = { top: 12, right: 8, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const slot = daily.length > 0 ? innerW / daily.length : innerW;
  const barW = Math.max(1.5, slot * 0.62);
  const ticks = [0, yMax / 2, yMax];
  const xLabels = daily.filter(
    (day) => day.day === 1 || day.day === daily.length || day.day % 5 === 0 || day.isToday,
  );

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 sm:divide-x sm:divide-neutral-100">
        <div className="sm:pr-5">
          <QuotaBar
            label="本站本月"
            used={siteMinutes}
            cap={includedMinutes}
            hint={
              quotaIsEstimate
                ? `对照免费档 ${includedMinutes} 分钟额度(私有仓库);公开仓库不消耗。`
                : "占 GitHub 帐户本月额度的比例。"
            }
          />
        </div>
        <div className="sm:pl-5">
          {accountMinutes != null ? (
            <QuotaBar
              label="整个 GitHub 帐户"
              used={Math.round(accountMinutes)}
              cap={includedMinutes}
              hint="含此帐户下其它私有仓库,不只是本站。"
            />
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-neutral-600">整个 GitHub 帐户</span>
                <span className="text-xs text-neutral-400">暂无法读取</span>
              </div>
              <p className="mt-2 text-2xl font-light tabular-nums text-neutral-800">
                {siteRunCount}
                <span className="ml-1.5 text-sm font-normal text-neutral-400">
                  次构建 · 本站{periodLabel}
                </span>
              </p>
              <p className="mt-auto pt-1.5 text-[11px] text-neutral-400">
                GitHub 未向此 App 开放帐户账单读取权限,完整用量请见账单页。
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-neutral-100 pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-medium text-neutral-700">每日消耗(分钟)</h3>
          <p className="min-h-[1.25rem] text-xs text-neutral-400">
            {hovered
              ? `${hovered.day}日 · ${hovered.runCount} 次 · ${formatMinutes(hovered.minutes)} 分钟${
                  hovered.isFuture ? " · 尚未到来" : hovered.isToday ? " · 今天" : ""
                }`
              : peak === 0
                ? "本月还没有构建消耗"
                : "悬停柱形查看某一天"}
          </p>
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mt-2 h-44 w-full"
          role="img"
          aria-label={`${periodLabel}每日 GitHub Actions 消耗,合计约 ${siteMinutes} 分钟`}
          onMouseLeave={() => setActive(null)}
        >
          {ticks.map((tick) => {
            const y = pad.top + innerH - (tick / yMax) * innerH;
            return (
              <g key={tick}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  stroke="#e5e5e5"
                  strokeWidth="1"
                />
                <text
                  x={pad.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-neutral-400"
                  fontSize="10"
                >
                  {tick === 0 ? "0" : formatMinutes(tick)}
                </text>
              </g>
            );
          })}
          <g>
            {daily.map((day, index) => {
              const x = pad.left + index * slot + (slot - barW) / 2;
              const rawH = day.isFuture || day.minutes <= 0 ? 0 : (day.minutes / yMax) * innerH;
              const barH = rawH > 0 ? Math.max(rawH, 3) : 0;
              const y = pad.top + innerH - barH;
              const isActive = active === index;
              const fill = day.isToday ? "#135e96" : isActive ? "#135e96" : "#2271b1";
              return (
                <g key={day.date}>
                  <rect
                    x={pad.left + index * slot}
                    y={pad.top}
                    width={slot}
                    height={innerH}
                    fill={isActive ? "rgba(34,113,177,0.06)" : "transparent"}
                    className="cursor-pointer"
                    onMouseEnter={() => setActive(index)}
                  />
                  {barH > 0 && (
                    <rect x={x} y={y} width={barW} height={barH} rx="1.5" fill={fill} />
                  )}
                  {barH === 0 && !day.isFuture && (
                    <rect
                      x={x}
                      y={pad.top + innerH - 1}
                      width={barW}
                      height={1}
                      fill="#d4d4d4"
                    />
                  )}
                </g>
              );
            })}
          </g>
          {xLabels.map((day) => {
            const index = day.day - 1;
            const x = pad.left + index * slot + slot / 2;
            return (
              <text
                key={`label-${day.date}`}
                x={x}
                y={height - 8}
                textAnchor="middle"
                className={day.isToday ? "fill-wp-accent" : "fill-neutral-400"}
                fontSize="10"
                fontWeight={day.isToday ? 600 : 400}
              >
                {day.isToday ? "今" : day.day}
              </text>
            );
          })}
        </svg>
        <p className="text-[11px] text-neutral-400">
          按构建墙钟时间估算;GitHub 按 job 向上取整到分钟,帐单数字可能略高。
        </p>
      </div>
    </div>
  );
}
