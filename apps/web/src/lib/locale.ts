/** BCP-47 helpers for admin UI copy and provisioned starter content. */

export function languageBase(language?: string): string {
  return (language ?? "en").toLowerCase().split("-")[0] ?? "en";
}

/** New-site default. English/other omit timezone so the first browser save can fill it. */
export function defaultTimeZone(language?: string): string | undefined {
  const base = languageBase(language);
  if (base === "zh") return "Asia/Shanghai";
  if (base === "ja") return "Asia/Tokyo";
  return undefined;
}

export function defaultHomeLabel(language?: string): string {
  const base = languageBase(language);
  if (base === "zh") return "首页";
  if (base === "ja") return "ホーム";
  return "Home";
}

export function defaultAboutTitle(language?: string): string {
  const base = languageBase(language);
  if (base === "zh") return "关于";
  if (base === "ja") return "このサイトについて";
  return "About";
}

export function defaultGitpressLabel(language?: string): string {
  const base = languageBase(language);
  if (base === "zh") return "由 GitPress 驱动";
  if (base === "ja") return "GitPress で構築";
  return "Powered by GitPress";
}

export function defaultThemeCreditLabel(language?: string, displayName = "theme"): string {
  const base = languageBase(language);
  if (base === "zh") return `主题 ${displayName}`;
  if (base === "ja") return `テーマ ${displayName}`;
  return `Theme: ${displayName}`;
}
