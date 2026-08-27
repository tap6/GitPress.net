import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// postgres-js connects lazily, so a placeholder URL is safe at build time.
const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/gitpress";

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
export * as tables from "./schema";
