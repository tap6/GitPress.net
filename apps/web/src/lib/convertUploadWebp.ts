/** Browser-side JPEG/PNG → WebP for GitPress uploads. Safe to import from server modules. */

export const WEBP_QUALITY = 0.82;

export function convertUploadsToWebpEnabled(site?: unknown): boolean {
  if (!site || typeof site !== "object") return true;
  return (site as { convertUploadsToWebp?: unknown }).convertUploadsToWebp !== false;
}

export function shouldConvertJpegPngToWebp(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("video/")) return false;
  if (type === "image/gif" || name.endsWith(".gif")) return false;
  if (type === "image/svg+xml" || name.endsWith(".svg")) return false;
  if (type === "image/webp" || name.endsWith(".webp")) return false;
  if (type === "image/avif" || name.endsWith(".avif")) return false;
  if (type === "image/jpeg" || type === "image/jpg" || name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return true;
  }
  if (type === "image/png" || name.endsWith(".png")) return true;
  return false;
}

function withWebpName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").trim() || "image";
  return `${base}.webp`;
}

/**
 * Convert a still JPEG/PNG to WebP in the browser.
 * Returns the original file when conversion is skipped, unsupported, fails,
 * or the WebP is not smaller.
 */
export async function convertJpegPngToWebp(file: File): Promise<File> {
  if (!shouldConvertJpegPngToWebp(file)) return file;
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") return file;
  try {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      bitmap = await createImageBitmap(file);
    }
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
    });
    if (!blob || blob.type !== "image/webp" || blob.size === 0 || blob.size >= file.size) {
      return file;
    }
    return new File([blob], withWebpName(file.name), { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
}

export function canvasToBrandDataUrl(canvas: HTMLCanvasElement, preferWebp: boolean): string {
  const jpeg = canvas.toDataURL("image/jpeg", 0.92);
  if (!preferWebp) return jpeg;
  try {
    const webp = canvas.toDataURL("image/webp", WEBP_QUALITY);
    if (!webp.startsWith("data:image/webp")) return jpeg;
    if (webp.length >= jpeg.length) return jpeg;
    return webp;
  } catch {
    return jpeg;
  }
}
