/**
 * Align Postgres with schema.ts. Additive only (no DROP / RENAME / type change).
 * Used at Vercel build. Auth routes also retry if this is skipped.
 * Never fail the Next.js build — a down database must not block deploys.
 */
import postgres from "postgres";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { syncSchemaAdditive } from "../src/db/schemaSync";

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

function resolveUrl(): string | undefined {
  return (
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL
  );
}

function isLocalDb(connectionUrl: string): boolean {
  try {
    const host = new URL(connectionUrl.replace(/^postgres(ql)?:/i, "http:")).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

async function main() {
  loadEnvLocal();
  const url = resolveUrl();
  if (!url) {
    console.log("[db:sync] skipped (DATABASE_URL unset)");
    return;
  }
  if (isLocalDb(url) && !process.env.VERCEL) {
    console.log("[db:sync] skipped (local DATABASE_URL)");
    return;
  }

  const client = postgres(url, {
    prepare: false,
    max: 1,
    connect_timeout: 20,
    onnotice: () => {},
  });
  try {
    await syncSchemaAdditive(client);
    console.log("[db:sync] ok");
  } catch (err) {
    console.error("[db:sync] failed; Next.js build will continue, runtime will retry:", err);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("[db:sync] failed; Next.js build will continue, runtime will retry:", err);
});
