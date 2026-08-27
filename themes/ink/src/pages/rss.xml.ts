import type { APIRoute } from "astro";
import { getPublishedPosts, postSlug, gitpress } from "../lib/gitpress";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const GET: APIRoute = async () => {
  const site = gitpress.site;
  const baseUrl = (site.url ?? "").replace(/\/$/, "");
  const posts = (await getPublishedPosts()).slice(0, 20);

  const items = posts
    .map((post) => {
      const url = `${baseUrl}/posts/${postSlug(post)}/`;
      return [
        "    <item>",
        `      <title>${escapeXml(post.data.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid>${escapeXml(url)}</guid>`,
        post.data.date ? `      <pubDate>${post.data.date.toUTCString()}</pubDate>` : "",
        post.data.description
          ? `      <description>${escapeXml(post.data.description)}</description>`
          : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(site.title)}</title>`,
    `    <link>${escapeXml(baseUrl || "/")}</link>`,
    `    <description>${escapeXml(site.description ?? "")}</description>`,
    `    <language>${escapeXml(site.language ?? "en")}</language>`,
    "    <generator>GitPress</generator>",
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
};
