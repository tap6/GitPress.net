export const SETTINGS_SECTION_EVENT = "gitpress:settings-section";

export const SETTINGS_SECTIONS = [
  { id: "general", label: "常规" },
  { id: "brand", label: "品牌" },
  { id: "footer", label: "页脚" },
  { id: "beian", label: "备案" },
  { id: "domain", label: "访问地址" },
  { id: "account", label: "AI 写作" },
  { id: "maintain", label: "维护" },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];

const ALIASES: Record<string, SettingsSectionId> = {
  "account-ai": "account",
};

const IDS = new Set<string>(SETTINGS_SECTIONS.map((item) => item.id));

export function parseSettingsSection(hash: string | null | undefined): SettingsSectionId {
  const raw = (hash ?? "").replace(/^#/, "").trim();
  if (!raw) return "general";
  if (ALIASES[raw]) return ALIASES[raw];
  if (IDS.has(raw)) return raw as SettingsSectionId;
  return "general";
}

export function settingsSectionLabel(id: SettingsSectionId): string {
  return SETTINGS_SECTIONS.find((item) => item.id === id)?.label ?? "常规";
}

/** Same-page switch: no App Router navigation, forms stay mounted. */
export function setSettingsSection(id: SettingsSectionId): void {
  const url = `${window.location.pathname}${window.location.search}#${id}`;
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new CustomEvent(SETTINGS_SECTION_EVENT, { detail: { id } }));
}
