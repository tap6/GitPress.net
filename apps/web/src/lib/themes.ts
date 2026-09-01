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
 * The `description` below is platform-only presentation copy for the
 * picker cards (see messages `themes.*`). The preview image itself comes
 * from each theme's `preview` field (usually `preview.svg`).
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
  author: string;
  version: string;
  license: string;
  homepage: string;
  tags: string[];
  /** Relative path inside the theme package, from theme.json `preview`. */
  preview: string;
  /** Admin picker URL served from /theme-previews/{name}. */
  previewSrc: string;
  configSchema: ThemeConfigSchema;
}

interface ThemeManifestJson {
  displayName?: string;
  description?: string;
  author?: string;
  version?: string;
  license?: string;
  homepage?: string;
  tags?: string[];
  preview?: string;
  configSchema?: ThemeConfigSchema;
}

const MANIFESTS: Record<string, ThemeManifestJson> = {
  classic: classicManifest,
  minimal: minimalManifest,
  ink: inkManifest,
  quill: quillManifest,
};

export const BUILTIN_THEMES: BuiltinTheme[] = Object.entries(MANIFESTS).map(([name, manifest]) => {
  return {
    name,
    displayName: manifest.displayName ?? name,
    description: manifest.description ?? "",
    author: manifest.author?.trim() || "GitPress",
    version: manifest.version?.trim() || "",
    license: manifest.license?.trim() || "",
    homepage: manifest.homepage?.trim() || "",
    tags: manifest.tags ?? [],
    preview: manifest.preview?.trim() || "preview.svg",
    previewSrc: `/theme-previews/${name}`,
    configSchema: manifest.configSchema ?? {},
  };
});

export function getBuiltinTheme(name: string): BuiltinTheme | undefined {
  return BUILTIN_THEMES.find((theme) => theme.name === name);
}

/**
 * Builtin option keys. UI copy lives in messages `themes.*`.
 * Community themes still work without an entry — JSON Schema `description`, then the raw key.
 */
const KNOWN_OPTION_KEYS = new Set([
  "accentColor",
  "showExcerpts",
  "showCovers",
  "showReadingTime",
  "defaultAppearance",
  "showLogo",
  "showAvatar",
  "showTitle",
  "showTagline",
  "showSearch",
  "showListTime",
  "showPostTime",
]);

export function themeOptionKey(key: string, property: ThemeConfigProperty): { kind: "known"; key: string } | { kind: "fallback"; text: string } {
  if (KNOWN_OPTION_KEYS.has(key)) return { kind: "known", key };
  return { kind: "fallback", text: property.description ?? key };
}

/** @deprecated Use themeOptionKey + next-intl. Kept for callers that still want a raw string. */
export function themeOptionLabel(key: string, property: ThemeConfigProperty): string {
  const resolved = themeOptionKey(key, property);
  return resolved.kind === "fallback" ? resolved.text : key;
}
