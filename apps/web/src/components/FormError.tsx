"use client";

import { useTranslations } from "next-intl";

export function isNeedAiConfig(error?: string | null) {
  return Boolean(error && (error === "needAiConfig" || error.startsWith("needAiConfig::")));
}

export function useFormErrorText() {
  const t = useTranslations("errors");
  return (error?: string | null) => {
    if (!error) return "";
    const sep = error.indexOf("::");
    const key = sep === -1 ? error : error.slice(0, sep);
    let values: Record<string, string | number> = {};
    if (sep !== -1) {
      try {
        values = JSON.parse(error.slice(sep + 2)) as Record<string, string | number>;
      } catch {
        return error;
      }
    }
    return t.has(key) ? t(key, values) : error;
  };
}

export function FormError({
  error,
  className = "rounded-md bg-red-50 p-3 text-sm text-red-600",
}: {
  error?: string;
  className?: string;
}) {
  const text = useFormErrorText()(error);
  if (!text) return null;
  return (
    <p data-form-error className={className}>
      {text}
    </p>
  );
}
