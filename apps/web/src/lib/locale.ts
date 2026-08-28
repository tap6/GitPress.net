/** BCP-47 helpers for admin UI copy and provisioned starter content. */

export function languageBase(language?: string): string {
  return (language ?? "en").toLowerCase().split("-")[0] ?? "en";
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
