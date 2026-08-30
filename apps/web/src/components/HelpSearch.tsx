"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { HelpArticleMeta } from "@/lib/helpArticles";

export function HelpSearch({ articles }: { articles: HelpArticleMeta[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return articles;
    return articles.filter((article) => {
      const hay = `${article.title} ${article.summary} ${article.keywords.join(" ")}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [articles, query]);

  return (
    <div>
      <label className="block">
        <span className="sr-only">搜索帮助</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索：草稿、构建、主题、域名…"
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-gp-brand focus:outline-none"
        />
      </label>
      <ul className="mt-8 space-y-4">
        {filtered.length === 0 ? (
          <li className="text-sm text-neutral-500">没有匹配的条目。换个词试试，或清空搜索看全部。</li>
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
