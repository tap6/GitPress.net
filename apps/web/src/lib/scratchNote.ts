import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteScratchNotes } from "@/db/schema";

export const SCRATCH_NOTE_MAX_CHARS = 8000;

export interface ScratchNote {
  body: string;
  enabled: boolean;
}

/** Missing row means the widget is on and empty — first save creates it. */
export async function getScratchNote(siteId: string): Promise<ScratchNote> {
  const [row] = await db
    .select()
    .from(siteScratchNotes)
    .where(eq(siteScratchNotes.siteId, siteId))
    .limit(1);
  if (!row) return { body: "", enabled: true };
  return { body: row.body, enabled: row.enabled };
}

export async function upsertScratchNote(
  siteId: string,
  patch: { body?: string; enabled?: boolean },
): Promise<ScratchNote> {
  const current = await getScratchNote(siteId);
  const body =
    patch.body !== undefined ? patch.body.slice(0, SCRATCH_NOTE_MAX_CHARS) : current.body;
  const enabled = patch.enabled ?? current.enabled;
  const updatedAt = new Date();
  await db
    .insert(siteScratchNotes)
    .values({ siteId, body, enabled, updatedAt })
    .onConflictDoUpdate({
      target: siteScratchNotes.siteId,
      set: { body, enabled, updatedAt },
    });
  return { body, enabled };
}
