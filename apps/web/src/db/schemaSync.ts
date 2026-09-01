import { isTable } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import type { Sql } from "postgres";
import * as schema from "./schema";

const DUPLICATE = new Set(["42P07", "42701", "42710", "23505"]);

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function schemaTables() {
  return Object.values(schema).filter(isTable);
}

function sqlDefault(column: {
  default: unknown;
  defaultFn?: unknown;
}): string | undefined {
  if (column.defaultFn) return undefined;
  const value = column.default;
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object" && value && "queryChunks" in value) {
    const chunks = (value as { queryChunks?: unknown[] }).queryChunks ?? [];
    const parts: string[] = [];
    for (const chunk of chunks) {
      if (typeof chunk === "string") parts.push(chunk);
      else if (chunk && typeof chunk === "object" && "value" in chunk) {
        const inner = (chunk as { value: unknown }).value;
        if (Array.isArray(inner)) {
          for (const piece of inner) if (typeof piece === "string") parts.push(piece);
        } else if (typeof inner === "string") parts.push(inner);
      }
    }
    return parts.join("") || undefined;
  }
  if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return undefined;
}

function columnSql(
  column: {
    name: string;
    notNull: boolean;
    primary: boolean;
    getSQLType: () => string;
    default: unknown;
    defaultFn?: unknown;
  },
  asPrimaryKey: boolean,
  allowNotNull: boolean,
): string {
  const parts = [quoteIdent(column.name), column.getSQLType()];
  const def = sqlDefault(column);
  if (def) parts.push("DEFAULT", def);
  if (allowNotNull && column.notNull) parts.push("NOT NULL");
  if (asPrimaryKey) parts.push("PRIMARY KEY");
  return parts.join(" ");
}

async function ignoreDuplicate(run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code && DUPLICATE.has(code)) return;
    throw err;
  }
}

export async function syncSchemaAdditive(client: Sql): Promise<void> {
  const existing = new Map<string, Set<string>>();
  const rows = await client<
    { table_name: string; column_name: string }[]
  >`select table_name, column_name from information_schema.columns where table_schema = 'public'`;
  for (const row of rows) {
    let cols = existing.get(row.table_name);
    if (!cols) {
      cols = new Set();
      existing.set(row.table_name, cols);
    }
    cols.add(row.column_name);
  }

  for (const table of schemaTables()) {
    const config = getTableConfig(table);
    const tableName = config.name;
    const pkFromGroup = config.primaryKeys[0]?.columns ?? [];
    const pkColumns = pkFromGroup.length > 0 ? pkFromGroup : config.columns.filter((col) => col.primary);
    const pkNames = new Set(pkColumns.map((col) => col.name));
    const inlinePk = pkColumns.length === 1;

    if (!existing.has(tableName)) {
      const defs = config.columns.map((col) =>
        columnSql(col, inlinePk && pkNames.has(col.name), true),
      );
      if (!inlinePk && pkColumns.length > 0) {
        defs.push(`PRIMARY KEY (${pkColumns.map((col) => quoteIdent(col.name)).join(", ")})`);
      }
      await ignoreDuplicate(() =>
        client.unsafe(`CREATE TABLE IF NOT EXISTS ${quoteIdent(tableName)} (${defs.join(", ")})`),
      );
      existing.set(tableName, new Set(config.columns.map((col) => col.name)));
      continue;
    }

    const have = existing.get(tableName)!;
    for (const col of config.columns) {
      if (have.has(col.name)) continue;
      // Existing rows make NOT NULL without a default fail; add the column first.
      await ignoreDuplicate(() =>
        client.unsafe(
          `ALTER TABLE ${quoteIdent(tableName)} ADD COLUMN IF NOT EXISTS ${columnSql(col, false, Boolean(sqlDefault(col)))}`,
        ),
      );
      have.add(col.name);
    }
  }

  for (const table of schemaTables()) {
    const config = getTableConfig(table);
    const tableName = config.name;
    const uniques: { name: string; columns: string[] }[] = [];
    for (const col of config.columns) {
      if (!col.isUnique) continue;
      uniques.push({
        name: col.uniqueName ?? `${tableName}_${col.name}_unique`,
        columns: [col.name],
      });
    }
    for (const constraint of config.uniqueConstraints) {
      uniques.push({
        name: constraint.getName() ?? `${tableName}_${constraint.columns.map((col) => col.name).join("_")}_unique`,
        columns: constraint.columns.map((col) => col.name),
      });
    }
    for (const unique of uniques) {
      await ignoreDuplicate(() =>
        client.unsafe(
          `CREATE UNIQUE INDEX IF NOT EXISTS ${quoteIdent(unique.name)} ON ${quoteIdent(tableName)} (${unique.columns.map(quoteIdent).join(", ")})`,
        ),
      );
    }
  }

  for (const table of schemaTables()) {
    const config = getTableConfig(table);
    for (const fk of config.foreignKeys) {
      const ref = fk.reference();
      const foreignTable = getTableConfig(ref.foreignTable).name;
      const cols = ref.columns.map((col) => quoteIdent(col.name)).join(", ");
      const foreignCols = ref.foreignColumns.map((col) => quoteIdent(col.name)).join(", ");
      const onDelete = fk.onDelete ? ` ON DELETE ${fk.onDelete}` : "";
      const onUpdate = fk.onUpdate ? ` ON UPDATE ${fk.onUpdate}` : "";
      await ignoreDuplicate(() =>
        client.unsafe(
          `ALTER TABLE ${quoteIdent(config.name)} ADD CONSTRAINT ${quoteIdent(fk.getName())} FOREIGN KEY (${cols}) REFERENCES ${quoteIdent(foreignTable)} (${foreignCols})${onDelete}${onUpdate}`,
        ),
      );
    }
  }
}
