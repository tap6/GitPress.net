/** Encode a next-intl `errors.*` key for `useActionState`. Optional values are JSON after `::`. */
export function actionError(key: string, values?: Record<string, string | number>): string {
  if (!values || Object.keys(values).length === 0) return key;
  return `${key}::${JSON.stringify(values)}`;
}

export function wrapCaughtError(error: unknown, fallbackKey = "saveFailed"): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/^[a-zA-Z][a-zA-Z0-9]+$/.test(message) || message.includes("::")) return message;
  return actionError(fallbackKey, { detail: message });
}
