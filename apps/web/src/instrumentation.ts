export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  if (!process.env.DATABASE_URL) return;
  try {
    const { ensureDbSchema } = await import("./db");
    await ensureDbSchema();
  } catch (err) {
    console.error("[db] schema sync failed", err);
  }
}
