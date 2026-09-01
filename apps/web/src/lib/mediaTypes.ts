/** Shared media kind / MIME helpers for the admin media library and preview API. */

export type MediaKind = "image" | "video" | "other";

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"]);
const VIDEO_EXT = new Set(["mp4", "webm", "mov", "m4v", "ogv", "ogg"]);

export const MEDIA_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/mp4",
  ogv: "video/ogg",
  ogg: "video/ogg",
};

export function mediaExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function mediaContentType(fileName: string): string {
  return MEDIA_TYPES[mediaExtension(fileName)] ?? "application/octet-stream";
}

export function mediaKind(fileName: string): MediaKind {
  const ext = mediaExtension(fileName);
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  return "other";
}

export function isPreviewableMedia(fileName: string): boolean {
  const kind = mediaKind(fileName);
  return kind === "image" || kind === "video";
}

/** File input accept string for the media library upload control. */
export const MEDIA_LIBRARY_ACCEPT =
  "image/*,video/mp4,video/webm,video/quicktime,video/ogg,.mp4,.webm,.mov,.m4v,.ogv";

export function assertAllowedMediaUpload(file: File): void {
  const kind = mediaKind(file.name);
  if (kind === "other") {
    throw new Error("mediaType");
  }
}
