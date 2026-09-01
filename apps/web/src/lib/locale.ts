/** BCP-47 helpers for provisioned starter content (site.language, not product locale). */

export function languageBase(language?: string): string {
  return (language ?? "en").toLowerCase().split("-")[0] ?? "en";
}

const STARTER: Record<string, { home: string; about: string; gitpress: string; theme: string; timezone?: string }> = {
  zh: { home: "首页", about: "关于", gitpress: "由 GitPress 驱动", theme: "主题 {name}", timezone: "Asia/Shanghai" },
  ja: { home: "ホーム", about: "このサイトについて", gitpress: "GitPress で構築", theme: "テーマ {name}", timezone: "Asia/Tokyo" },
  en: { home: "Home", about: "About", gitpress: "Powered by GitPress", theme: "Theme: {name}" },
};

function starter(language?: string) {
  return STARTER[languageBase(language)] ?? STARTER.en;
}

/** New-site default. English/other omit timezone so the first browser save can fill it. */
export function defaultTimeZone(language?: string): string | undefined {
  return starter(language).timezone;
}

export function defaultHomeLabel(language?: string): string {
  return starter(language).home;
}

export function defaultAboutTitle(language?: string): string {
  return starter(language).about;
}

export function defaultGitpressLabel(language?: string): string {
  return starter(language).gitpress;
}

export function defaultThemeCreditLabel(language?: string, displayName = "theme"): string {
  return starter(language).theme.replace("{name}", displayName);
}
