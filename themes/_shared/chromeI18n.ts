/**
 * Builtin-theme chrome strings keyed by BCP-47 language base (zh / ja / en).
 * Unknown languages fall back to English. Keep this file free of theme-specific
 * markup so classic/minimal/ink/quill can import it from `../_shared`.
 */

export type ChromeKey =
  | "home"
  | "search"
  | "searchUnavailable"
  | "prevPage"
  | "nextPage"
  | "paginationNav"
  | "emptyPosts"
  | "emptyCategory"
  | "archive"
  | "archiveCount"
  | "undated"
  | "minRead"
  | "gitpressCredit"
  | "themeCredit";

export type PagefindUiTranslations = {
  placeholder: string;
  clear_search: string;
  load_more: string;
  search_label: string;
  filters_label: string;
  zero_results: string;
  many_results: string;
  one_result: string;
  alt_search: string;
  search_suggestion: string;
  searching: string;
};

type ChromeMessages = Record<ChromeKey, string> & { pagefind: PagefindUiTranslations };

export function languageBase(language?: string): string {
  return (language ?? "en").toLowerCase().split("-")[0] ?? "en";
}

const EN: ChromeMessages = {
  home: "Home",
  search: "Search",
  searchUnavailable: "Search is not available yet. It will work after the site finishes building.",
  prevPage: "Previous",
  nextPage: "Next",
  paginationNav: "Pagination",
  emptyPosts: "No posts yet. Write your first one!",
  emptyCategory: "This category has no posts yet.",
  archive: "Archive",
  archiveCount: "{n} posts in total",
  undated: "Undated",
  minRead: "{n} min read",
  gitpressCredit: "Powered by GitPress",
  themeCredit: "Theme: {name}",
  pagefind: {
    placeholder: "Search…",
    clear_search: "Clear",
    load_more: "Load more results",
    search_label: "Search this site",
    filters_label: "Filters",
    zero_results: "No results for [SEARCH_TERM]",
    many_results: "[COUNT] results for [SEARCH_TERM]",
    one_result: "[COUNT] result for [SEARCH_TERM]",
    alt_search: "No results for [SEARCH_TERM]. Showing results for [DIFFERENT_TERM]",
    search_suggestion: "No results for [SEARCH_TERM]. Try one of the following searches:",
    searching: "Searching for [SEARCH_TERM]…",
  },
};

const ZH: ChromeMessages = {
  home: "首页",
  search: "搜索",
  searchUnavailable: "搜索暂时不可用。站点完成构建后即可使用。",
  prevPage: "上一页",
  nextPage: "下一页",
  paginationNav: "分页导航",
  emptyPosts: "还没有文章。写第一篇吧！",
  emptyCategory: "这个分类还没有文章。",
  archive: "归档",
  archiveCount: "共 {n} 篇",
  undated: "无日期",
  minRead: "{n} 分钟阅读",
  gitpressCredit: "由 GitPress 驱动",
  themeCredit: "主题 {name}",
  pagefind: {
    placeholder: "搜索…",
    clear_search: "清除",
    load_more: "加载更多",
    search_label: "搜索本站",
    filters_label: "筛选",
    zero_results: "没有找到「[SEARCH_TERM]」",
    many_results: "「[SEARCH_TERM]」的 [COUNT] 条结果",
    one_result: "「[SEARCH_TERM]」的 [COUNT] 条结果",
    alt_search: "没有找到「[SEARCH_TERM]」。显示「[DIFFERENT_TERM]」的结果",
    search_suggestion: "没有找到「[SEARCH_TERM]」。试试：",
    searching: "正在搜索「[SEARCH_TERM]」…",
  },
};

const JA: ChromeMessages = {
  home: "ホーム",
  search: "検索",
  searchUnavailable: "検索はまだ利用できません。サイトのビルドが完了すると使えます。",
  prevPage: "前へ",
  nextPage: "次へ",
  paginationNav: "ページネーション",
  emptyPosts: "まだ記事がありません。最初の記事を書きましょう。",
  emptyCategory: "このカテゴリにはまだ記事がありません。",
  archive: "アーカイブ",
  archiveCount: "全 {n} 件",
  undated: "日付なし",
  minRead: "{n} 分で読めます",
  gitpressCredit: "GitPress で構築",
  themeCredit: "テーマ {name}",
  pagefind: {
    placeholder: "検索…",
    clear_search: "クリア",
    load_more: "さらに読み込む",
    search_label: "サイト内検索",
    filters_label: "フィルター",
    zero_results: "「[SEARCH_TERM]」に一致する結果はありません",
    many_results: "「[SEARCH_TERM]」の検索結果 [COUNT] 件",
    one_result: "「[SEARCH_TERM]」の検索結果 [COUNT] 件",
    alt_search: "「[SEARCH_TERM]」は見つかりませんでした。「[DIFFERENT_TERM]」の結果を表示します",
    search_suggestion: "「[SEARCH_TERM]」は見つかりませんでした。次を試してください：",
    searching: "「[SEARCH_TERM]」を検索中…",
  },
};

const BY_BASE: Record<string, ChromeMessages> = {
  en: EN,
  zh: ZH,
  ja: JA,
};

function messagesFor(language?: string): ChromeMessages {
  return BY_BASE[languageBase(language)] ?? EN;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, String(value));
  }
  return out;
}

export function chromeString(
  language: string | undefined,
  key: ChromeKey,
  vars?: Record<string, string | number>,
): string {
  const dict = messagesFor(language);
  return interpolate(dict[key] ?? EN[key], vars);
}

export function pagefindUiTranslations(language?: string): PagefindUiTranslations {
  return messagesFor(language).pagefind;
}
