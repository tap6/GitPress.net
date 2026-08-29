export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping?: "pathname";
  lang?: string;
}

export interface SiteComments {
  enabled?: boolean;
  giscus?: GiscusConfig;
}

export function parseGiscusConfig(value: unknown): GiscusConfig | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.repo !== "string" ||
    typeof raw.repoId !== "string" ||
    typeof raw.category !== "string" ||
    typeof raw.categoryId !== "string"
  ) {
    return undefined;
  }
  return {
    repo: raw.repo,
    repoId: raw.repoId,
    category: raw.category,
    categoryId: raw.categoryId,
    mapping: raw.mapping === "pathname" ? "pathname" : undefined,
    lang: typeof raw.lang === "string" ? raw.lang : undefined,
  };
}

export function parseSiteComments(value: unknown): SiteComments {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : undefined,
    giscus: parseGiscusConfig(raw.giscus),
  };
}

/** Absent enabled = on when giscus or a legacy snippet is already configured. */
export function commentsEnabled(comments: SiteComments, snippet?: string): boolean {
  if (comments.enabled !== undefined) return comments.enabled;
  return Boolean(comments.giscus || snippet);
}

export function giscusLang(language?: string): string {
  const lang = (language ?? "en").toLowerCase();
  if (lang.startsWith("zh-tw") || lang.startsWith("zh-hant")) return "zh-TW";
  if (lang.startsWith("zh")) return "zh-CN";
  if (lang.startsWith("ja")) return "ja";
  return "en";
}

export function pickGiscusCategory<T extends { name: string }>(categories: T[]): T | undefined {
  return categories.find((item) => item.name === "Announcements") ?? categories[0];
}
