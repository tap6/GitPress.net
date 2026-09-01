import { handlers as nextAuthHandlers } from "@/auth";
import { ensureDbSchema } from "@/db";

export async function GET(...args: Parameters<typeof nextAuthHandlers.GET>) {
  await ensureDbSchema();
  return nextAuthHandlers.GET(...args);
}

export async function POST(...args: Parameters<typeof nextAuthHandlers.POST>) {
  await ensureDbSchema();
  return nextAuthHandlers.POST(...args);
}
