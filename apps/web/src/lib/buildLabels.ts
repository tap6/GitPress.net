/**
 * Turns GitPress-generated git commit messages into structured labels.
 * Parsing still matches the existing Chinese/English machine commit format.
 * Display copy lives in messages `buildHistory.*`.
 */

export type GitChangeKind =
  | "post"
  | "page"
  | "media"
  | "theme"
  | "settings"
  | "nav"
  | "build"
  | "init"
  | "other";

export interface GitChangeDescription {
  kind: GitChangeKind;
  key: string;
  values?: Record<string, string | number>;
  fallback: string;
}

function baseName(path: string): string {
  return path.split("/").pop()?.replace(/\.md$/, "") ?? path;
}

function stripImageSuffix(rest: string): { title: string; images: number } {
  const match = rest.match(/^(.*) \(\+(\d+) images?\)$/);
  if (!match) return { title: rest, images: 0 };
  return { title: match[1], images: Number(match[2]) };
}

function described(
  kind: GitChangeKind,
  key: string,
  fallback: string,
  values?: Record<string, string | number>,
): GitChangeDescription {
  return { kind, key, values, fallback };
}

export function describeGitChange(commitMessage: string | null): GitChangeDescription {
  if (!commitMessage) return described("other", "changeNone", "");
  const first = commitMessage.split("\n")[0]?.trim() || commitMessage;

  const addPost = first.match(/^Add post: (.+)$/);
  if (addPost) {
    const { title, images } = stripImageSuffix(addPost[1]);
    if (images > 0) return described("post", "addPostImages", first, { title, n: images });
    return described("post", "addPost", first, { title });
  }

  const updatePost = first.match(/^Update post: (.+)$/);
  if (updatePost) {
    const { title, images } = stripImageSuffix(updatePost[1]);
    if (images > 0) return described("post", "savePostImages", first, { title, n: images });
    return described("post", "savePost", first, { title });
  }

  const meta = first.match(/^Update post meta: (.+)$/);
  if (meta) return described("post", "updatePostMeta", first, { title: meta[1] });

  const deletePost = first.match(/^Delete post: (.+)$/);
  if (deletePost) return described("post", "deletePost", first, { title: baseName(deletePost[1]) });

  const addPage = first.match(/^Add page: (.+)$/);
  if (addPage) {
    const { title, images } = stripImageSuffix(addPage[1]);
    if (images > 0) return described("page", "addPageImages", first, { title, n: images });
    return described("page", "addPage", first, { title });
  }

  const updatePage = first.match(/^Update page: (.+)$/);
  if (updatePage) {
    const { title, images } = stripImageSuffix(updatePage[1]);
    if (images > 0) return described("page", "savePageImages", first, { title, n: images });
    return described("page", "savePage", first, { title });
  }

  const deletePage = first.match(/^Delete page: (.+)$/);
  if (deletePage) return described("page", "deletePage", first, { title: baseName(deletePage[1]) });

  const upload = first.match(/^Upload media: (.+)$/);
  if (upload) return described("media", "uploadMedia", first, { name: upload[1] });

  const deleteMedia = first.match(/^Delete media: (.+)$/);
  if (deleteMedia) return described("media", "deleteMedia", first, { name: baseName(deleteMedia[1]) });

  const theme = first.match(/^Switch theme to (.+)$/);
  if (theme) {
    const name = theme[1].replace(/\s+from\s+\S+$/, "").trim();
    return described("theme", "switchTheme", first, { name });
  }

  if (first === "Update theme options") return described("theme", "themeOptions", first);

  const imported = first.match(/^Import theme (.+) from (.+)$/);
  if (imported) return described("theme", "importTheme", first, { name: imported[1] });

  if (first === "Update site settings") return described("settings", "siteSettings", first);
  if (first === "Update site analytics" || first.startsWith("Update site analytics ")) {
    return described("settings", "analytics", first);
  }
  const setDomain = first.match(/^Set custom domain: (.+)$/);
  if (setDomain) return described("settings", "setDomain", first, { domain: setDomain[1] });
  const siteUrl = first.match(/^Update site URL: (.+)$/);
  if (siteUrl) return described("settings", "siteUrl", first, { url: siteUrl[1] });
  if (first === "Remove custom domain") return described("settings", "removeDomain", first);
  if (first === "Remove Pages custom domain") return described("settings", "removePagesDomain", first);
  if (first.startsWith("Set custom domain")) return described("settings", "setDomainGeneric", first);
  if (first.startsWith("Update site URL")) return described("settings", "siteUrlGeneric", first);
  if (first === "Update site logo and avatar") return described("settings", "logoAvatar", first);
  if (first === "Update categories") return described("settings", "categories", first);
  if (first === "Connect giscus comments") return described("settings", "connectComments", first);
  if (first === "Enable comments") return described("settings", "enableComments", first);
  if (first === "Disable comments") return described("settings", "disableComments", first);
  if (first === "Disconnect giscus comments") return described("settings", "disconnectComments", first);
  if (first === "Update comments snippet") return described("settings", "commentsSnippet", first);
  if (first === "Update footer") return described("settings", "footer", first);
  if (first === "Update beian") return described("settings", "beian", first);
  if (first === "Update menu") return described("nav", "menu", first);
  if (first === "Trigger rebuild") return described("build", "rebuild", first);
  if (first.startsWith("Initialize ")) {
    const file = first.slice("Initialize ".length);
    return described("init", "initFile", first, { name: baseName(file) });
  }

  return described("other", "raw", first, { text: first });
}

export function describeBuildTrigger(
  commitMessage: string | null,
  event?: string | null,
): GitChangeDescription {
  if (event === "schedule") return described("build", "schedule", "schedule");
  if (!commitMessage) return described("build", "build", "build");
  return describeGitChange(commitMessage);
}

export function describeCommitAuthorKey(login: string | null, name: string | null): {
  key: string;
  values?: Record<string, string>;
  fallback: string;
} {
  if (login?.endsWith("[bot]")) return { key: "botAuthor", fallback: login };
  if (login) return { key: "githubLogin", values: { login }, fallback: `@${login}` };
  if (name) return { key: "rawName", values: { name }, fallback: name };
  return { key: "unknownAuthor", fallback: "" };
}

const SHANGHAI = "Asia/Shanghai";

function shanghaiYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function shiftYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

export function shanghaiDayKey(iso: string): string {
  return shanghaiYmd(new Date(iso));
}

export function shanghaiDayHeading(iso: string, locale: string, now = new Date()): { key?: "today" | "yesterday"; formatted: string } {
  const day = shanghaiYmd(new Date(iso));
  const today = shanghaiYmd(now);
  if (day === today) return { key: "today", formatted: day };
  if (day === shiftYmd(today, -1)) return { key: "yesterday", formatted: day };
  const bcp = locale === "zh" ? "zh-CN" : "en";
  return {
    formatted: new Intl.DateTimeFormat(bcp, {
      timeZone: SHANGHAI,
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(new Date(iso)),
  };
}

export function formatShanghaiDateTime(iso: string, locale: string): string {
  const bcp = locale === "zh" ? "zh-CN" : "en";
  return new Intl.DateTimeFormat(bcp, {
    timeZone: SHANGHAI,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatGitChange(
  desc: GitChangeDescription,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (desc.key === "raw") return String(desc.values?.text ?? desc.fallback);
  return t(desc.key, desc.values);
}

export function formatCommitAuthor(
  login: string | null,
  name: string | null,
  t: (key: string, values?: Record<string, string>) => string,
): string {
  const author = describeCommitAuthorKey(login, name);
  if (author.key === "githubLogin") return `@${author.values!.login}`;
  if (author.key === "rawName") return author.values!.name;
  return t(author.key);
}

export function formatDayHeading(
  iso: string,
  locale: string,
  t: (key: string) => string,
): string {
  const day = shanghaiDayHeading(iso, locale);
  if (day.key === "today" || day.key === "yesterday") return t(day.key);
  return day.formatted;
}

function formatDurationParts(
  seconds: number | null,
): { seconds: number } | { m: number; s: number } | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null;
  const whole = Math.round(seconds);
  if (whole < 60) return { seconds: whole };
  return { m: Math.floor(whole / 60), s: whole % 60 };
}

export function formatDurationLabel(
  seconds: number | null,
  t: (key: string, values?: Record<string, number>) => string,
): string | null {
  const parts = formatDurationParts(seconds);
  if (!parts) return null;
  if ("seconds" in parts) return t("durationSeconds", { s: parts.seconds });
  return t("duration", { m: parts.m, s: parts.s });
}
