import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

const PRIVATE = ["/dashboard", "/sites/", "/ops", "/account", "/new", "/api/", "/theme-previews"];

/** Same crawl budget as `*`, named so training/answer bots are not left with an empty Disallow. */
const AI_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "meta-externalagent",
];

function privatePaths(): string[] {
  const prefixed = PRIVATE.flatMap((path) => [path, `/en${path}`]);
  return [...new Set(prefixed)];
}

export default function robots(): MetadataRoute.Robots {
  const disallow = privatePaths();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...AI_USER_AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
