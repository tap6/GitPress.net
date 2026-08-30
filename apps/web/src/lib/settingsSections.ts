export const SETTINGS_SECTION_EVENT = "gitpress:settings-section";

export const SETTINGS_SECTIONS = [
  { id: "general", label: "常规" },
  { id: "comments", label: "评论区" },
  { id: "brand", label: "品牌" },
  { id: "footer", label: "页脚" },
  { id: "beian", label: "备案" },
  { id: "domain", label: "访问地址" },
  { id: "account", label: "AI 写作" },
  { id: "widgets", label: "小工具" },
  { id: "maintain", label: "维护" },
] as const;

export type SettingsPanelId = (typeof SETTINGS_SECTIONS)[number]["id"];
/** `all` = 点「设置」本身，每一块都显示。 */
export type SettingsSectionId = SettingsPanelId | "all";

const ALIASES: Record<string, SettingsPanelId> = {
  "account-ai": "account",
};

const IDS = new Set<string>(SETTINGS_SECTIONS.map((item) => item.id));

export function parseSettingsSection(hash: string | null | undefined): SettingsSectionId {
  const raw = (hash ?? "").replace(/^#/, "").trim();
  if (!raw || raw === "all") return "all";
  if (ALIASES[raw]) return ALIASES[raw];
  if (IDS.has(raw)) return raw as SettingsPanelId;
  return "all";
}

export function settingsSectionLabel(id: SettingsSectionId): string {
  if (id === "all") return "全部";
  return SETTINGS_SECTIONS.find((item) => item.id === id)?.label ?? "全部";
}

/** Same-page switch: no App Router navigation, forms stay mounted. */
export function setSettingsSection(id: SettingsSectionId): void {
  const hash = id === "all" ? "" : `#${id}`;
  const url = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new CustomEvent(SETTINGS_SECTION_EVENT, { detail: { id } }));
}
