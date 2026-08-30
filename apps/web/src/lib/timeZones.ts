/** Common IANA zones for the settings picker. Browser zone is appended if missing. */
export const COMMON_TIME_ZONES: Array<{ id: string; label: string }> = [
  { id: "Asia/Shanghai", label: "中国 (北京时间)" },
  { id: "Asia/Hong_Kong", label: "香港" },
  { id: "Asia/Taipei", label: "台北" },
  { id: "Asia/Tokyo", label: "日本 (東京)" },
  { id: "Asia/Seoul", label: "한국 (서울)" },
  { id: "Asia/Singapore", label: "Singapore" },
  { id: "Asia/Kolkata", label: "India" },
  { id: "Asia/Dubai", label: "Gulf" },
  { id: "Australia/Sydney", label: "Australia (Sydney)" },
  { id: "Pacific/Auckland", label: "New Zealand" },
  { id: "Europe/London", label: "UK" },
  { id: "Europe/Paris", label: "Central Europe" },
  { id: "Europe/Berlin", label: "Germany" },
  { id: "Europe/Moscow", label: "Moscow" },
  { id: "America/New_York", label: "US Eastern" },
  { id: "America/Chicago", label: "US Central" },
  { id: "America/Denver", label: "US Mountain" },
  { id: "America/Los_Angeles", label: "US Pacific" },
  { id: "America/Toronto", label: "Canada (Toronto)" },
  { id: "America/Sao_Paulo", label: "Brasil (São Paulo)" },
  { id: "Africa/Johannesburg", label: "South Africa" },
  { id: "UTC", label: "UTC" },
];

export const TIME_ZONE_FIELD = "timeZone";

export function isIanaTimeZone(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const tz = value.trim();
  if (!tz) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz }).format();
    return true;
  } catch {
    return false;
  }
}

export function readIanaTimeZone(formData: FormData): string | null {
  const selected = formData.get("timezone");
  if (isIanaTimeZone(selected)) return String(selected).trim();
  const stamped = formData.get(TIME_ZONE_FIELD);
  return isIanaTimeZone(stamped) ? String(stamped).trim() : null;
}

/** Language heuristic when gitpress.json has no timezone yet. */
export function inferTimeZoneFromLanguage(language?: string | null): string {
  const lang = (language ?? "").toLowerCase();
  if (lang.startsWith("zh")) return "Asia/Shanghai";
  if (lang.startsWith("ja")) return "Asia/Tokyo";
  return "UTC";
}

export function resolveSiteTimeZone(site: { timezone?: unknown; language?: unknown } | null | undefined): string {
  if (isIanaTimeZone(site?.timezone)) return String(site.timezone).trim();
  return inferTimeZoneFromLanguage(typeof site?.language === "string" ? site.language : undefined);
}
