export interface HelpArticleMeta {
  href: string;
  id:
    | "whatIs"
    | "privacy"
    | "makeTheme"
    | "drafts"
    | "builds"
    | "aiWriting"
    | "importTheme"
    | "analytics"
    | "domain";
}

export const HELP_ARTICLES: HelpArticleMeta[] = [
  { href: "/help/what-is-gitpress", id: "whatIs" },
  { href: "/privacy", id: "privacy" },
  { href: "/help/make-theme", id: "makeTheme" },
  { href: "/help/drafts-and-builds", id: "drafts" },
  { href: "/help/builds", id: "builds" },
  { href: "/help/ai-writing", id: "aiWriting" },
  { href: "/help/import-theme", id: "importTheme" },
  { href: "/help/analytics", id: "analytics" },
  { href: "/help/custom-domain", id: "domain" },
];
