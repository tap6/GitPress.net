/**
 * Turns GitPress-generated git commit messages into short Chinese labels
 * the dashboard and Git-history page can share. Unknown messages fall back
 * to the first line as-is, so a hand-written commit never disappears.
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
  label: string;
  kind: GitChangeKind;
  kindLabel: string;
}

const KIND_LABELS: Record<GitChangeKind, string> = {
  post: "文章",
  page: "页面",
  media: "媒体",
  theme: "外观",
  settings: "设置",
  nav: "菜单",
  build: "构建",
  init: "初始化",
  other: "其他",
};

function baseName(path: string): string {
  return path.split("/").pop()?.replace(/\.md$/, "") ?? path;
}

function stripImageSuffix(rest: string): { title: string; images: number } {
  const match = rest.match(/^(.*) \(\+(\d+) images?\)$/);
  if (!match) return { title: rest, images: 0 };
  return { title: match[1], images: Number(match[2]) };
}

function postLabel(verb: string, rest: string): string {
  const { title, images } = stripImageSuffix(rest);
  if (images > 0) return `${verb}文章「${title}」（含 ${images} 张图）`;
  return `${verb}文章「${title}」`;
}

function pageLabel(verb: string, rest: string): string {
  const { title, images } = stripImageSuffix(rest);
  if (images > 0) return `${verb}页面「${title}」（含 ${images} 张图）`;
  return `${verb}页面「${title}」`;
}

function described(kind: GitChangeKind, label: string): GitChangeDescription {
  return { label, kind, kindLabel: KIND_LABELS[kind] };
}

export function describeGitChange(commitMessage: string | null): GitChangeDescription {
  if (!commitMessage) return described("other", "一次改动");
  const first = commitMessage.split("\n")[0]?.trim() || commitMessage;

  const addPost = first.match(/^Add post: (.+)$/);
  if (addPost) return described("post", postLabel("发布了", addPost[1]));

  const updatePost = first.match(/^Update post: (.+)$/);
  if (updatePost) return described("post", postLabel("保存了", updatePost[1]));

  const meta = first.match(/^Update post meta: (.+)$/);
  if (meta) return described("post", `更新了文章信息「${meta[1]}」`);

  const deletePost = first.match(/^Delete post: (.+)$/);
  if (deletePost) return described("post", `删除了文章「${baseName(deletePost[1])}」`);

  const addPage = first.match(/^Add page: (.+)$/);
  if (addPage) return described("page", pageLabel("发布了", addPage[1]));

  const updatePage = first.match(/^Update page: (.+)$/);
  if (updatePage) return described("page", pageLabel("保存了", updatePage[1]));

  const deletePage = first.match(/^Delete page: (.+)$/);
  if (deletePage) return described("page", `删除了页面「${baseName(deletePage[1])}」`);

  const upload = first.match(/^Upload media: (.+)$/);
  if (upload) return described("media", `上传了媒体「${upload[1]}」`);

  const deleteMedia = first.match(/^Delete media: (.+)$/);
  if (deleteMedia) return described("media", `删除了媒体「${baseName(deleteMedia[1])}」`);

  const theme = first.match(/^Switch theme to (.+)$/);
  if (theme) {
    const name = theme[1].replace(/\s+from\s+\S+$/, "").trim();
    return described("theme", `把主题换成了「${name}」`);
  }

  if (first === "Update theme options") return described("theme", "调整了主题选项");

  const imported = first.match(/^Import theme (.+) from (.+)$/);
  if (imported) return described("theme", `导入了主题「${imported[1]}」`);

  if (first === "Update site settings") return described("settings", "更新了站点设置");
  const setDomain = first.match(/^Set custom domain: (.+)$/);
  if (setDomain) return described("settings", `在 GitHub Pages 登记了「${setDomain[1]}」`);
  const siteUrl = first.match(/^Update site URL: (.+)$/);
  if (siteUrl) return described("settings", `更新了站点地址「${siteUrl[1]}」`);
  if (first === "Remove custom domain") return described("settings", "恢复了默认 Pages 地址");
  if (first === "Remove Pages custom domain") return described("settings", "取消了 Pages 域名登记");
  if (first.startsWith("Set custom domain")) return described("settings", "在 GitHub Pages 登记了域名");
  if (first.startsWith("Update site URL")) return described("settings", "更新了站点地址");
  if (first === "Update site logo and avatar") return described("settings", "更新了站点标志与头像");
  if (first === "Update categories") return described("settings", "更新了分类");
  if (first === "Connect giscus comments") return described("settings", "连接了评论区");
  if (first === "Enable comments") return described("settings", "开启了评论");
  if (first === "Disable comments") return described("settings", "关闭了评论");
  if (first === "Disconnect giscus comments") return described("settings", "断开了评论区");
  if (first === "Update comments snippet") return described("settings", "更新了评论嵌入代码");
  if (first === "Update footer") return described("settings", "更新了页脚");
  if (first === "Update beian") return described("settings", "更新了备案信息");
  if (first === "Update menu") return described("nav", "更新了导航菜单");
  if (first === "Trigger rebuild") return described("build", "手动触发了重建");
  if (first.startsWith("Initialize ")) {
    const file = first.slice("Initialize ".length);
    return described("init", `初始化了「${baseName(file)}」`);
  }

  return described("other", first);
}

export function describeBuildTrigger(commitMessage: string | null): string {
  if (!commitMessage) return "构建";
  return describeGitChange(commitMessage).label;
}

export function describeCommitAuthor(login: string | null, name: string | null): string {
  if (login?.endsWith("[bot]")) return "GitPress 代为提交";
  if (login) return `@${login}`;
  if (name) return name;
  return "未知作者";
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

export function shanghaiDayHeading(iso: string, now = new Date()): string {
  const day = shanghaiYmd(new Date(iso));
  const today = shanghaiYmd(now);
  if (day === today) return "今天";
  if (day === shiftYmd(today, -1)) return "昨天";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: SHANGHAI,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(iso));
}

export function formatShanghaiDateTime(iso: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: SHANGHAI,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatDuration(seconds: number | null): string | null {
  if (seconds == null) return null;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}分${rest}秒`;
}
