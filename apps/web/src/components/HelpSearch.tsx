"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { HelpArticleMeta } from "@/lib/helpArticles";

export function HelpSearch({ articles }: { articles: HelpArticleMeta[] }) {
  const [query, setQuery] = useState("");
  const t = useTranslations("help");
  const ti = useTranslations("helpIndex");
  const resolved = articles.map((article) => ({
    ...article,
    title: t(`${article.id}.title`),
    summary: t(`${article.id}.summary`),
    keywords: t(`${article.id}.keywords`),
  }));
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return resolved;
    return resolved.filter((article) => {
      const hay = `${article.title} ${article.summary} ${article.keywords}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [resolved, query]);

  return (
    <div>
      <label className="block">
        <span className="sr-only">{ti("searchAria")}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={ti("searchPlaceholder")}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-gp-brand focus:outline-none"
        />
      </label>
      <ul className="mt-8 space-y-4">
        {filtered.length === 0 ? (
          <li className="text-sm text-neutral-500">{ti("empty")}</li>
        ) : (
          filtered.map((article) => (
            <li key={article.href}>
              <Link
                href={article.href}
                className="block rounded-lg border border-neutral-200 bg-white p-5 shadow-sm hover:border-neutral-300"
              >
                <h2 className="text-lg font-semibold text-neutral-900">{article.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-500">{article.summary}</p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
