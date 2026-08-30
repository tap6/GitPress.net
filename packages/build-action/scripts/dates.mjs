/**
 * Interpret unzoned YAML dates as wall clocks in the site timezone and rewrite
 * them with an explicit offset so Astro/js-yaml parse a real instant.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function pad(value) {
  return String(value).padStart(2, "0");
}

export function inferTimeZone(site) {
  const configured = typeof site?.timezone === "string" ? site.timezone.trim() : "";
  if (configured) {
    try {
      Intl.DateTimeFormat("en-US", { timeZone: configured }).format();
      return configured;
    } catch {
      /* fall through */
    }
  }
  const lang = (site?.language ?? "").toLowerCase();
  if (lang.startsWith("zh")) return "Asia/Shanghai";
  if (lang.startsWith("ja")) return "Asia/Tokyo";
  return "UTC";
}

function offsetMinutesForInstant(timeZone, date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  const name = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  if (name === "GMT" || name === "UTC") return 0;
  const match = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/) ?? name.match(/UTC([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

function formatOffset(minutes) {
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export function offsetAtWallClock(wall, timeZone) {
  const [ymd, hms = "00:00:00"] = wall.split("T");
  const [year, month, day] = ymd.split("-").map(Number);
  const [hour, minute, second] = hms.split(":").map(Number);
  let utcGuess = Date.UTC(year, month - 1, day, hour, minute, second || 0);
  for (let i = 0; i < 4; i += 1) {
    const offset = offsetMinutesForInstant(timeZone, new Date(utcGuess));
    utcGuess = Date.UTC(year, month - 1, day, hour, minute, second || 0) - offset * 60_000;
  }
  return formatOffset(offsetMinutesForInstant(timeZone, new Date(utcGuess)));
}

function normalizeWall(raw) {
  const value = String(raw).trim();
  if (!value) return null;
  if (/[zZ]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) return null;
  const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dateOnly) return `${dateOnly[1]}T00:00:00`;
  const local = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?$/);
  if (local) return `${local[1]}T${local[2]}:${local[3] ?? "00"}`;
  return null;
}

export function rewriteUnzonedFrontmatterDates(text, timeZone) {
  return text.replace(/^(date|updated):\s*(.+)$/gm, (full, key, raw) => {
    const stripped = String(raw).trim().replace(/^['"]|['"]$/g, "");
    const wall = normalizeWall(stripped);
    if (!wall) return full;
    return `${key}: "${wall}${offsetAtWallClock(wall, timeZone)}"`;
  });
}

function walkMarkdown(dir, files = []) {
  if (!dir) return files;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const name of entries) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walkMarkdown(path, files);
    else if (name.endsWith(".md")) files.push(path);
  }
  return files;
}

export function rewritePostDatesInDir(dir, timeZone) {
  let changed = 0;
  for (const path of walkMarkdown(dir)) {
    const original = readFileSync(path, "utf8");
    const next = rewriteUnzonedFrontmatterDates(original, timeZone);
    if (next !== original) {
      writeFileSync(path, next);
      changed += 1;
    }
  }
  return changed;
}
