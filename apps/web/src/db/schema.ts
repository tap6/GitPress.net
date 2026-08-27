import {
  boolean,
  bigint,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
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
