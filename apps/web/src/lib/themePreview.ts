import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, relative, resolve, sep } from "node:path";

const THEMES_ROOT = resolve(process.cwd(), "..", "..", "themes");

const MIME: Record<string, string> = {
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export function readBuiltinThemePreview(
  name: string,
  previewPath: string,
): { body: Buffer; type: string } | null {
  if (!/^[a-z0-9-]+$/.test(name)) return null;
  const relativePath = previewPath.replace(/^\/+/, "").trim();
  if (!relativePath || relativePath.includes("\0")) return null;

  const themeDir = resolve(THEMES_ROOT, name);
  const file = resolve(themeDir, relativePath);
  const rel = relative(themeDir, file);
  if (!rel || rel.startsWith(`..${sep}`) || rel === ".." || rel.startsWith("../")) return null;
  if (!existsSync(file) || !statSync(file).isFile()) return null;

  return {
    body: readFileSync(file),
    type: MIME[extname(file).toLowerCase()] ?? "application/octet-stream",
  };
}
