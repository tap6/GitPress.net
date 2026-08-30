export type ThemeBadgeKind = "official" | "listed";

export type ThemeShelfKind = "builtin" | "catalog" | "library";

export interface ThemeShelfItem {
  id: string;
  kind: ThemeShelfKind;
  badge: ThemeBadgeKind | null;
  name: string;
  displayName: string;
  author: string;
  description: string;
  previewSrc: string | null;
  source: string;
  version: string;
  license: string;
  homepage: string;
  githubUrl: string | null;
  active: boolean;
}
