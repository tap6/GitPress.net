/**
 * Turns the raw git commit message that triggered a build into a short,
 * human-readable label for the dashboard's "最近构建" list — e.g.
 * `Add post: Hello World` -> `发布文章:Hello World`. Falls back to the raw
 * message (or a generic label) for anything we don't recognize, so future
 * commit types never disappear from the list, just show up unlocalized.
 */
const PATTERNS: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^Add post: (.+)$/, (m) => `发布文章:${m[1]}`],
  [/^Update post: (.+)$/, (m) => `更新文章:${m[1]}`],
  [/^Delete post: (.+)$/, (m) => `删除文章:${baseName(m[1])}`],
  [/^Upload media: (.+)$/, (m) => `上传媒体:${m[1]}`],
  [/^Delete media: (.+)$/, (m) => `删除媒体:${baseName(m[1])}`],
  [/^Switch theme to (.+)$/, (m) => `切换主题为「${m[1]}」`],
  [/^Update theme options$/, () => "调整主题选项"],
  [/^Update site settings$/, () => "更新站点设置"],
  [/^Trigger rebuild$/, () => "手动触发重建"],
  [/^Initialize /, () => "站点初始化"],
];

function baseName(path: string): string {
  return path.split("/").pop()?.replace(/\.md$/, "") ?? path;
}

export function describeBuildTrigger(commitMessage: string | null): string {
  if (!commitMessage) return "构建";
  for (const [pattern, format] of PATTERNS) {
    const match = commitMessage.match(pattern);
    if (match) return format(match);
  }
  return commitMessage;
}

export function formatDuration(seconds: number | null): string | null {
  if (seconds == null) return null;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}分${rest}秒`;
}
