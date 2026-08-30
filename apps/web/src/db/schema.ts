import {
  boolean,
  bigint,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ---------------------------------------------------------------------------
// Auth.js standard tables (Drizzle adapter)
// ---------------------------------------------------------------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  /**
   * Platform operator (`"ops"`). Site owners leave this null.
   * Access is `role = "ops"` **or** an email in `GITPRESS_OPS_EMAILS`.
   */
  role: text("role").$type<"ops" | null>(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// ---------------------------------------------------------------------------
// GitPress metadata (never content — content lives in the user's repos)
// ---------------------------------------------------------------------------

/** A GitHub App installation connected by a user. */
export const githubInstallations = pgTable("github_installation", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  installationId: bigint("installation_id", { mode: "number" }).notNull().unique(),
  accountLogin: text("account_login").notNull(),
  /** "User" | "Organization" */
  accountType: text("account_type").notNull(),
  /** User-to-server token from OAuth-on-install; used for repo creation on personal accounts. */
  userToken: text("user_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/** A GitPress site = one data repo (private) + one site repo (public). */
export const sites = pgTable("site", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  installationId: text("installation_fk")
    .notNull()
    .references(() => githubInstallations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  language: text("language").notNull().default("en"),
  themeName: text("theme_name").notNull(),
  /**
   * Mirror of `gitpress.json` `theme.source` for ops dashboards.
   * `"builtin"` or `github:owner/repo[/<subdir>]#<ref>`. Not a cache of theme files.
   */
  themeSource: text("theme_source").notNull().default("builtin"),
  themeConfig: jsonb("theme_config").$type<Record<string, unknown>>().default({}),
  /** "owner/name" */
  dataRepo: text("data_repo").notNull(),
  /** "owner/name" */
  siteRepo: text("site_repo").notNull(),
  /** Public site URL (Pages by default). */
  url: text("url"),
  basePath: text("base_path").notNull().default("/"),
  /** Whether GitHub Pages was enabled successfully. */
  pagesEnabled: boolean("pages_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * One AI provider configuration per user (shared across all of their sites —
 * in practice one person uses one AI key everywhere). The API key is
 * encrypted with `encryptSecret` (see lib/crypto.ts) before it ever reaches
 * the database.
 */
export const aiSettings = pgTable("ai_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** OpenAI-compatible base URL, e.g. https://api.openai.com/v1 */
  baseUrl: text("base_url").notNull(),
  model: text("model").notNull(),
  apiKeyEncrypted: text("api_key_encrypted").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Theme store catalog. Each row is a pointer to a public GitHub theme repo
 * (`github:owner/repo#ref`), not a hosted package. Built-in themes stay in
 * code (`BUILTIN_THEMES`); they are not duplicated here.
 */
export type ThemeListingStatus = "listed" | "hidden" | "pending";

export const themeListings = pgTable("theme_listing", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** `theme.json` `name`. */
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull().default(""),
  author: text("author").notNull().default(""),
  version: text("version").notNull().default(""),
  license: text("license").notNull().default(""),
  homepage: text("homepage").notNull().default(""),
  /** Relative path inside the theme package, usually `preview.svg`. */
  preview: text("preview").notNull().default("preview.svg"),
  /** Normalized `github:owner/repo[/<subdir>]#<ref>`. */
  source: text("source").notNull().unique(),
  status: text("status").$type<ThemeListingStatus>().notNull().default("listed"),
  /** Operator-only notes; never shown to site owners. */
  notes: text("notes"),
  createdByUserId: text("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Per-site imported theme shelf. Pointers only — theme files stay on GitHub.
 * The currently enabled theme is still `gitpress.json` / `sites.themeSource`.
 */
export const siteThemeLibrary = pgTable(
  "site_theme_library",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    /** Normalized `github:owner/repo[/<subdir>]#<ref>`. */
    source: text("source").notNull(),
    name: text("name").notNull(),
    displayName: text("display_name").notNull(),
    author: text("author").notNull().default(""),
    description: text("description").notNull().default(""),
    preview: text("preview").notNull().default("preview.svg"),
    version: text("version").notNull().default(""),
    license: text("license").notNull().default(""),
    homepage: text("homepage").notNull().default(""),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [unique("site_theme_library_site_source").on(table.siteId, table.source)],
);

/**
 * Per-site dashboard scratch pad. Control-plane only — never written to
 * the data repo, so saving it does not trigger a build.
 */
export const siteScratchNotes = pgTable("site_scratch_note", {
  siteId: text("site_id")
    .primaryKey()
    .references(() => sites.id, { onDelete: "cascade" }),
  body: text("body").notNull().default(""),
  /** When false the dashboard widget stays hidden until re-enabled in Settings → 小工具. */
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
