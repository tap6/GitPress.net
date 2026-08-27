/**
 * Registry of builtin themes (mirrors themes/* in the open-source monorepo).
 * The store (later phase) will extend this with community themes; the shape
 * matches theme.json so third-party themes slot in without schema changes.
 */

export interface BuiltinTheme {
  name: string;
  displayName: string;
  description: string;
  /** Colors used to render the picker preview card. */
  palette: { bg: string; fg: string; accent: string; muted: string };
  serif: boolean;
  options: Array<{
    key: string;
    label: string;
    type: "color" | "boolean";
    defaultValue: string | boolean;
  }>;
}

export const BUILTIN_THEMES: BuiltinTheme[] = [
  {
    name: "classic",
    displayName: "Classic",
    description: "温暖的衬线字体、居中版式,经典博客气质。",
    palette: { bg: "#faf8f5", fg: "#2c2620", accent: "#a85a2a", muted: "#8a7f72" },
    serif: true,
    options: [
      { key: "accentColor", label: "强调色", type: "color", defaultValue: "#a85a2a" },
      { key: "showExcerpts", label: "列表显示摘要", type: "boolean", defaultValue: true },
    ],
  },
  {
    name: "minimal",
    displayName: "Minimal",
    description: "留白充分、以排版为先的极简风格。",
    palette: { bg: "#ffffff", fg: "#1a1a1a", accent: "#2563eb", muted: "#9a9a9a" },
    serif: false,
    options: [
      { key: "accentColor", label: "强调色", type: "color", defaultValue: "#2563eb" },
      { key: "showExcerpts", label: "列表显示摘要", type: "boolean", defaultValue: false },
    ],
  },
  {
    name: "ink",
    displayName: "Ink",
    description: "暗色卡片式杂志风,适合夜猫子。",
    palette: { bg: "#0e1013", fg: "#e8e6e3", accent: "#f59e0b", muted: "#8b8f98" },
    serif: false,
    options: [
      { key: "accentColor", label: "强调色", type: "color", defaultValue: "#f59e0b" },
      { key: "showCovers", label: "卡片显示封面图", type: "boolean", defaultValue: true },
    ],
  },
];

export function getBuiltinTheme(name: string): BuiltinTheme | undefined {
  return BUILTIN_THEMES.find((theme) => theme.name === name);
}
