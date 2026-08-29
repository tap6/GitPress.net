/**
 * Registry of builtin themes (mirrors themes/* in the open-source monorepo).
 *
 * `configSchema` is imported directly from each theme's own `theme.json` —
 * the same file the build action and any community theme ship — instead of
 * being re-typed here. That is what lets the settings form on the
 * appearance page render automatically for *any* theme that declares a
 * configSchema, including future community/AI-generated themes, without a
 * platform code change every time a theme adds an option.
 *
 * `palette`/`serif`/the Chinese `description` below are platform-only
 * presentation metadata (theme picker preview cards) that has no equivalent
 * in the open spec, so it stays hand-maintained here.
 */
import classicManifest from "../../../../themes/classic/theme.json";
import minimalManifest from "../../../../themes/minimal/theme.json";
import inkManifest from "../../../../themes/ink/theme.json";
import quillManifest from "../../../../themes/quill/theme.json";

/** Minimal shape we rely on from a theme's `configSchema` (JSON Schema, draft 2020-12). */
export interface ThemeConfigProperty {
  type?: string;
  /** "color" is a GitPress convention (see packages/spec/schemas/theme.schema.json) rendered as a color picker. */
  format?: string;
  enum?: readonly string[];
  default?: unknown;
  description?: string;
}

export interface ThemeConfigSchema {
  properties?: Record<string, ThemeConfigProperty>;
}

export interface BuiltinTheme {
  name: string;
  displayName: string;
  description: string;
  /** Colors used to render the picker preview card. */
  palette: { bg: string; fg: string; accent: string; muted: string };
  serif: boolean;
  configSchema: ThemeConfigSchema;
}

const PRESENTATION: Record<
  string,
  { description: string; palette: BuiltinTheme["palette"]; serif: boolean }
> = {
  classic: {
    description: "温暖的衬线字体、居中版式,经典博客气质。",
    palette: { bg: "#faf8f5", fg: "#2c2620", accent: "#a85a2a", muted: "#8a7f72" },
    serif: true,
  },
  minimal: {
    description: "留白充分、以排版为先的极简风格。",
    palette: { bg: "#ffffff", fg: "#1a1a1a", accent: "#2563eb", muted: "#9a9a9a" },
    serif: false,
  },
  ink: {
    description: "暗色卡片式杂志风,适合夜猫子。",
    palette: { bg: "#0e1013", fg: "#e8e6e3", accent: "#f59e0b", muted: "#8b8f98" },
    serif: false,
  },
  quill: {
    description: "卡片式列表、标签、阅读时长,一键切换浅色/深色。",
    palette: { bg: "#fafafa", fg: "#17171a", accent: "#5b5bd6", muted: "#6b6b76" },
    serif: false,
  },
};

/** Loosely-typed shape of theme.json — just enough for this registry. */
interface ThemeManifestJson {
  displayName?: string;
  description?: string;
  configSchema?: ThemeConfigSchema;
}

const MANIFESTS: Record<string, ThemeManifestJson> = {
  classic: classicManifest,
  minimal: minimalManifest,
  ink: inkManifest,
  quill: quillManifest,
};

export const BUILTIN_THEMES: BuiltinTheme[] = Object.entries(MANIFESTS).map(([name, manifest]) => {
  const presentation = PRESENTATION[name];
  return {
    name,
    displayName: manifest.displayName ?? name,
    description: presentation?.description ?? manifest.description ?? "",
    palette: presentation?.palette ?? { bg: "#ffffff", fg: "#1a1a1a", accent: "#2563eb", muted: "#9a9a9a" },
    serif: presentation?.serif ?? false,
    configSchema: manifest.configSchema ?? {},
  };
});

export function getBuiltinTheme(name: string): BuiltinTheme | undefined {
  return BUILTIN_THEMES.find((theme) => theme.name === name);
}

/**
 * Chinese labels for option keys used by GitPress's own builtin themes.
 * Any theme (including community ones) still works without an entry here —
 * its JSON Schema `description` is used instead, falling back to the raw key.
 */
const KNOWN_OPTION_LABELS: Record<string, string> = {
  accentColor: "强调色",
  showExcerpts: "列表显示摘要",
  showCovers: "卡片显示封面图",
  showReadingTime: "显示阅读时长",
  defaultAppearance: "默认外观",
  showLogo: "显示 Logo",
  showAvatar: "显示头像",
  showTitle: "显示站点名称",
  showTagline: "显示站点简介",
  showSearch: "显示搜索",
};

export function themeOptionLabel(key: string, property: ThemeConfigProperty): string {
  return KNOWN_OPTION_LABELS[key] ?? property.description ?? key;
}
