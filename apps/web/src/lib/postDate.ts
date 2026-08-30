/** Wall-clock post timestamps. Stored as `YYYY-MM-DDTHH:mm:ss` (no timezone). */

export const CLIENT_NOW_FIELD = "clientNow";
export const TZ_OFFSET_FIELD = "tzOffsetMinutes";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatLocalDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatUtcYmdHms(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

export function nowLocalDateTime(): string {
  return formatLocalDateTime(new Date());
}

/**
 * Author wall clock from `Date#getTimezoneOffset` (minutes to add to local to get UTC).
 * Needed because Vercel is UTC: `nowLocalDateTime()` there is not the writer's "now".
 */
export function nowFromTimezoneOffset(offsetMinutes: unknown): string | null {
  if (offsetMinutes == null || String(offsetMinutes).trim() === "") return null;
  const n = Number(offsetMinutes);
  if (!Number.isFinite(n) || !Number.isInteger(n) || Math.abs(n) > 14 * 60) return null;
  return formatUtcYmdHms(new Date(Date.now() - n * 60_000));
}

/** Compare datetime-local values against the author clock, not the server process timezone. */
export function readAuthorNow(formData: FormData): string {
  const fromOffset = nowFromTimezoneOffset(formData.get(TZ_OFFSET_FIELD));
  if (fromOffset) return fromOffset;
  const stamped = parsePostDate(formData.get(CLIENT_NOW_FIELD));
  if (stamped) return stamped;
  return nowLocalDateTime();
}

/** Normalize frontmatter / form values to `YYYY-MM-DDTHH:mm:ss`, or null. */
export function parsePostDate(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatLocalDateTime(value);
  }
  const raw = String(value).trim();
  if (!raw) return null;

  const dateOnly = raw.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dateOnly) return `${dateOnly[1]}T00:00:00`;

  const local = raw.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?/);
  if (local) return `${local[1]}T${local[2]}:${local[3] ?? "00"}`;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatLocalDateTime(parsed);
}

/** One-line admin display: `2026-08-30 12:33:05`. */
export function formatPostDateTime(value: string | null | undefined): string {
  const normalized = parsePostDate(value);
  if (!normalized) return "—";
  return normalized.replace("T", " ");
}

export function datetimeLocalValue(value: string | null | undefined, fallback = nowLocalDateTime()): string {
  return parsePostDate(value) ?? fallback;
}
