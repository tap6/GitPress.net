/** Next.js `redirect()` / `notFound()` throw a special error that try/catch must rethrow. */
export function isNextControlFlowError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const digest = "digest" in error ? (error as { digest: unknown }).digest : undefined;
  if (typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND"))) {
    return true;
  }
  const message = error instanceof Error ? error.message : "";
  return message === "NEXT_REDIRECT" || message === "NEXT_NOT_FOUND";
}
