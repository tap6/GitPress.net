import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { syncSchemaAdditive } from "./schemaSync";

// postgres-js connects lazily, so a placeholder URL is safe at build time.
const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/gitpress";

const client = postgres(connectionString, { prepare: false });

let schemaReady: Promise<void> | null = null;

/** Create missing tables/columns from schema.ts. Never drops. */
export function ensureDbSchema(): Promise<void> {
  if (!process.env.DATABASE_URL) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = syncSchemaAdditive(client).catch((err: { code?: string }) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export const db = drizzle(client, { schema });
export * as tables from "./schema";
