/** Client- and server-safe helpers for media filenames. No Node-only imports. */

/** Strip path traversal but keep an already-unique client-generated name intact. */
export function sanitizeMediaFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop()?.replace(/\0/g, "").trim() ?? "";
  if (!base || base.includes("..")) return `image-${Date.now()}.png`;
  return base;
}

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_BATCH_IMAGES = 20;
export const MAX_BATCH_BYTES = 20 * 1024 * 1024;

/** Generate a collision-resistant name before inserting into the editor. */
export function uniqueMediaFileName(fileName: string): string {
  const trimmed = fileName.split(/[/\\]/).pop() ?? "image";
  const dot = trimmed.lastIndexOf(".");
  const extRaw = dot >= 0 ? trimmed.slice(dot + 1) : "png";
  const ext = extRaw.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const stemRaw = dot >= 0 ? trimmed.slice(0, dot) : trimmed;
  const stem =
    stemRaw
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "image";
  const rand = Math.random().toString(36).slice(2, 8);
  return `${stem}-${Date.now().toString(36)}-${rand}.${ext}`;
}
