/**
 * Vercel / CI: align Postgres with src/db/schema.ts using DATABASE_URL
 * (Neon injects this). Additive only — never DROP / RENAME / TYPE change.
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { pushSchema } from "drizzle-kit/api";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as schema from "../src/db/schema";
import { isDestructiveSchemaSql, syncSchemaAdditive } from "../src/db/schemaSync";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[db:sync] skipped (DATABASE_URL unset)");
  process.exit(0);
}

function isLocalDb(connectionUrl: string): boolean {
  try {
    const host = new URL(connectionUrl.replace(/^postgres(ql)?:/i, "http:")).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

if (isLocalDb(url) && !process.env.VERCEL) {
  console.log("[db:sync] skipped (local DATABASE_URL)");
  process.exit(0);
}

async function main() {
  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);
  try {
    const { statementsToExecute } = await pushSchema(schema, db);
    const additive = statementsToExecute.filter((sql) => !isDestructiveSchemaSql(sql));
    const skipped = statementsToExecute.filter((sql) => isDestructiveSchemaSql(sql));
    if (skipped.length > 0) {
      console.warn(`[db:sync] skipping ${skipped.length} destructive statement(s)`);
      for (const sql of skipped) console.warn(`  ${sql}`);
    }
    if (additive.length === 0) {
      console.log("[db:sync] schema already matches");
    } else {
      console.log(`[db:sync] applying ${additive.length} additive statement(s)`);
      for (const sql of additive) {
        await client.unsafe(sql);
      }
    }
  } catch (err) {
    console.warn("[db:sync] drizzle-kit pushSchema failed, falling back to additive sync:", err);
    try {
      await syncSchemaAdditive(client);
    } catch (fallbackErr) {
      console.error("[db:sync] failed", fallbackErr);
      process.exitCode = 1;
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("[db:sync] failed", err);
  process.exit(1);
});
