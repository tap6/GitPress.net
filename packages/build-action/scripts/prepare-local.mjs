#!/usr/bin/env node
/**
 * Local development helper: mount a data directory (e.g. templates/data-repo)
 * into a theme project the same way the build action does, so you can run
 * `astro dev` / `astro build` inside the theme.
 *
 * Usage: node packages/build-action/scripts/prepare-local.mjs <theme-dir> <data-dir>
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { applyAnalyticsSnippet } from "./analytics.mjs";
import { inferTimeZone, rewritePostDatesInDir } from "./dates.mjs";

const [themeArg, dataArg] = process.argv.slice(2);
if (!themeArg || !dataArg) {
  console.error("Usage: prepare-local.mjs <theme-dir> <data-dir>");
  process.exit(1);
}

const themeDir = resolve(themeArg);
const dataDir = resolve(dataArg);
if (!existsSync(join(themeDir, "theme.json"))) {
  console.error(`Not a theme directory (theme.json missing): ${themeDir}`);
  process.exit(1);
}

/** Template files contain {{PLACEHOLDER}} tokens; substitute dev-friendly defaults. */
const DEV_PLACEHOLDERS = {
  SITE_TITLE: "GitPress Dev Site",
  SITE_DESCRIPTION: "Local preview with sample content",
  SITE_LANGUAGE: "en",
  SITE_URL: "http://localhost:4321",
  SITE_BASE_PATH: "/",
  SITE_AUTHOR: "Developer",
  THEME_NAME: "dev",
  FIRST_POST_TITLE: "Hello, world",
  TODAY: new Date().toISOString().slice(0, 10),
  SITE_REPO: "example/site",
  BUILD_ACTION_REPO: "gitpress-net/build-action",
};

function substitute(text) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => DEV_PLACEHOLDERS[key] ?? match);
}

const mountContent = join(themeDir, "user-content");
rmSync(mountContent, { recursive: true, force: true });
mkdirSync(join(mountContent, "posts"), { recursive: true });
mkdirSync(join(mountContent, "pages"), { recursive: true });
if (existsSync(join(dataDir, "content"))) {
  cpSync(join(dataDir, "content"), mountContent, { recursive: true });
}

const mountMedia = join(themeDir, "public", "media");
rmSync(mountMedia, { recursive: true, force: true });
if (existsSync(join(dataDir, "media"))) {
  cpSync(join(dataDir, "media"), mountMedia, { recursive: true });
}

const config = JSON.parse(substitute(readFileSync(join(dataDir, "gitpress.json"), "utf8")));
applyAnalyticsSnippet(config);
writeFileSync(join(themeDir, "gitpress.config.json"), `${JSON.stringify(config, null, 2)}\n`);

// Substitute placeholders in copied markdown as well (template files only).
for (const sub of ["posts", "pages"]) {
  const dir = join(mountContent, sub);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const path = join(dir, file);
    writeFileSync(path, substitute(readFileSync(path, "utf8")));
  }
}
rewritePostDatesInDir(join(mountContent, "posts"), inferTimeZone(config.site));

console.log(`Mounted ${dataDir} into ${themeDir}. Run astro dev/build inside the theme now.`);
