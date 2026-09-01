export const SETTINGS_SECTION_EVENT = "gitpress:settings-section";

export const SETTINGS_SECTIONS = [
  { id: "general" },
  { id: "comments" },
  { id: "brand" },
  { id: "footer" },
  { id: "beian" },
  { id: "domain" },
  { id: "account" },
  { id: "widgets" },
  { id: "publish" },
  { id: "maintain" },
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

/** Same-page switch: no App Router navigation, forms stay mounted. */
export function setSettingsSection(id: SettingsSectionId): void {
  const hash = id === "all" ? "" : `#${id}`;
  const url = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new CustomEvent(SETTINGS_SECTION_EVENT, { detail: { id } }));
}
