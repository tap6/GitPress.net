#!/usr/bin/env node
/**
 * GitPress build action v1.
 *
 * Runs inside a checkout of the DATA repository. Steps:
 *   1. read + validate gitpress.json (schemaVersion 1 only — refuse anything else)
 *   2. fetch the pinned theme (builtin monorepo or github:<owner>/<repo>[/<subdir>]#<ref>)
 *   3. mount data-repo files into the theme project (user-content/, public/media/, gitpress.config.json)
 *   4. astro build (drafts excluded unless explicitly enabled)
 *   5. publish dist/ to the site repository (deploy key or token)
 */
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SUPPORTED_SCHEMA_VERSION = 1;

function log(message) {
  console.log(`[gitpress] ${message}`);
}

function fail(message) {
  console.error(`[gitpress] ERROR: ${message}`);
  process.exit(1);
}

function run(cmd, args, options = {}) {
  log(`$ ${cmd} ${args.join(" ")}`);
  return execFileSync(cmd, args, { stdio: "inherit", ...options });
}

// ---------------------------------------------------------------------------
// 1. Read and validate gitpress.json
// ---------------------------------------------------------------------------
const dataDir = process.cwd();
const configPath = join(dataDir, "gitpress.json");
if (!existsSync(configPath)) fail("gitpress.json not found at the repository root.");

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf8"));
} catch (error) {
  fail(`gitpress.json is not valid JSON: ${error.message}`);
}

if (config.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
  fail(
    `Unsupported schemaVersion ${config.schemaVersion}. This action (@v1) understands version ${SUPPORTED_SCHEMA_VERSION}. ` +
      "Refusing to build rather than risk breaking your site — check the GitPress upgrade guide.",
  );
}
if (!config.site?.title) fail("gitpress.json: site.title is required.");
if (!config.theme?.name || !config.theme?.source) {
  fail("gitpress.json: theme.name and theme.source are required.");
}

const includeDrafts =
  process.env.GP_INCLUDE_DRAFTS === "true" || config.build?.includeDrafts === true;
const outputDir = config.build?.output ?? "dist";
log(`Site: "${config.site.title}"  theme: ${config.theme.name} (${config.theme.source})`);

// ---------------------------------------------------------------------------
// 2. Fetch the theme
// ---------------------------------------------------------------------------
const workDir = mkdtempSync(join(tmpdir(), "gitpress-"));
let themeDir;

const { source, name, ref } = config.theme;
if (source === "builtin") {
  const themesRepo = process.env.GP_THEMES_REPO || "gitpress-net/gitpress";
  const pin = ref || "v1";
  const cloneDir = join(workDir, "themes-monorepo");
  run("git", [
    "clone",
    "--depth",
    "1",
    "--branch",
    pin,
    `https://github.com/${themesRepo}.git`,
    cloneDir,
  ]);
  themeDir = join(cloneDir, "themes", name);
  if (!existsSync(themeDir)) fail(`Builtin theme "${name}" not found in ${themesRepo}@${pin}.`);
} else if (source.startsWith("github:")) {
  // github:<owner>/<repo>[/<subdir...>]#<ref>
  const spec = source.slice("github:".length);
  const [repoPath, hashRef] = spec.split("#");
  const segments = repoPath.split("/");
  if (segments.length < 2) fail(`Invalid theme source "${source}".`);
  const repo = segments.slice(0, 2).join("/");
  const subdir = segments.slice(2).join("/");
  const pin = ref || hashRef;
  const cloneDir = join(workDir, "theme-repo");
  const cloneArgs = ["clone", "--depth", "1"];
  if (pin) cloneArgs.push("--branch", pin);
  cloneArgs.push(`https://github.com/${repo}.git`, cloneDir);
  run("git", cloneArgs);
  themeDir = subdir ? join(cloneDir, subdir) : cloneDir;
  if (!existsSync(themeDir)) fail(`Theme directory "${subdir}" not found in ${repo}.`);
} else if (source.startsWith("npm:")) {
  fail(
    'theme.source "npm:" is reserved by spec v1 but not yet supported by this action version. Use "builtin" or "github:".',
  );
} else {
  fail(`Unknown theme.source "${source}". Supported: "builtin", "github:<owner>/<repo>[/<subdir>]#<ref>".`);
}

const manifestPath = join(themeDir, "theme.json");
if (!existsSync(manifestPath)) fail("Theme is missing theme.json.");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.specVersion !== SUPPORTED_SCHEMA_VERSION) {
  fail(`Theme "${name}" implements spec v${manifest.specVersion}; this action supports v${SUPPORTED_SCHEMA_VERSION}.`);
}
if (manifest.engine !== "astro") fail(`Unsupported theme engine "${manifest.engine}".`);

// ---------------------------------------------------------------------------
// 3. Mount data-repo files into the theme project
// ---------------------------------------------------------------------------
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

writeFileSync(join(themeDir, "gitpress.config.json"), JSON.stringify(config, null, 2));
log("Mounted content, media and config into the theme project.");

// ---------------------------------------------------------------------------
// 4. Build
// ---------------------------------------------------------------------------
run("npm", ["install", "--no-audit", "--no-fund"], { cwd: themeDir });
run("npx", ["astro", "build"], {
  cwd: themeDir,
  env: {
    ...process.env,
    GITPRESS_INCLUDE_DRAFTS: includeDrafts ? "true" : "false",
  },
});

const distDir = join(themeDir, outputDir);
if (!existsSync(distDir) || readdirSync(distDir).length === 0) {
  fail(`Build produced no output in "${outputDir}".`);
}
log("Astro build succeeded.");

const buildId = (process.env.GITHUB_SHA ?? `local-${Date.now()}`).slice(0, 12);
injectVisitorCacheBust(distDir, buildId, config.site?.basePath);

// ---------------------------------------------------------------------------
// 5. Publish dist/ to the site repository
// ---------------------------------------------------------------------------
const siteRepo = process.env.GP_SITE_REPO;
if (!siteRepo) {
  log("No site-repo configured — skipping publish (dry run).");
  process.exit(0);
}

const deployKey = process.env.GP_DEPLOY_KEY;
const siteToken = process.env.GP_SITE_TOKEN;
if (!deployKey && !siteToken) {
  fail("Either deploy-key or site-token is required to publish to the site repository.");
}

const publishDir = join(workDir, "site-repo");
const gitEnv = { ...process.env };
let remoteUrl;

if (deployKey) {
  const keyPath = join(workDir, "deploy_key");
  writeFileSync(keyPath, deployKey.endsWith("\n") ? deployKey : `${deployKey}\n`, { mode: 0o600 });
  gitEnv.GIT_SSH_COMMAND = `ssh -i ${keyPath} -o StrictHostKeyChecking=accept-new -o IdentitiesOnly=yes`;
  remoteUrl = `git@github.com:${siteRepo}.git`;
} else {
  remoteUrl = `https://x-access-token:${siteToken}@github.com/${siteRepo}.git`;
}

execFileSync("git", ["clone", "--depth", "1", remoteUrl, publishDir], {
  stdio: "inherit",
  env: gitEnv,
});

// Replace everything except .git with the fresh build output.
// CNAME is preserved so custom domains configured on GitHub Pages survive rebuilds.
const preservedCname = existsSync(join(publishDir, "CNAME"))
  ? readFileSync(join(publishDir, "CNAME"), "utf8")
  : null;
for (const entry of readdirSync(publishDir)) {
  if (entry === ".git") continue;
  rmSync(join(publishDir, entry), { recursive: true, force: true });
}
cpSync(distDir, publishDir, { recursive: true });
writeFileSync(join(publishDir, ".nojekyll"), "");
if (preservedCname && !existsSync(join(publishDir, "CNAME"))) {
  writeFileSync(join(publishDir, "CNAME"), preservedCname);
}

const commitSha = (process.env.GITHUB_SHA ?? "local").slice(0, 12);
const gitIn = (args) => execFileSync("git", ["-C", publishDir, ...args], { stdio: "inherit", env: gitEnv });
gitIn(["config", "user.name", "gitpress-bot"]);
gitIn(["config", "user.email", "bot@gitpress.net"]);
gitIn(["add", "-A"]);
try {
  gitIn(["commit", "-m", `GitPress build from ${commitSha}`]);
} catch {
  log("Nothing changed since the last build — site is already up to date.");
  process.exit(0);
}
// The site repo may be empty (unborn default branch): push current HEAD to main.
gitIn(["push", "origin", "HEAD:main"]);
log(`Published to ${siteRepo}. GitHub Pages / Vercel will pick it up from here.`);

/**
 * GitHub Pages caches HTML (~10 min) and ignores custom Cache-Control.
 * Visitors who only hit Cmd+R often keep a stale document after a theme
 * switch. We stamp every HTML page with this build's id, ship a tiny
 * no-store JSON sidecar, and reload once if they disagree. A navigate
 * network-first service worker covers subsequent visits. vercel.json helps
 * sites imported into Vercel. Themes must not implement this themselves.
 */
function injectVisitorCacheBust(distDir, buildId, basePath) {
  const prefix = posixPrefix(basePath);
  const builtAt = new Date().toISOString();
  writeFileSync(
    join(distDir, "gitpress-build.json"),
    `${JSON.stringify({ id: buildId, builtAt })}\n`,
  );
  writeFileSync(join(distDir, "sw.js"), serviceWorkerSource());
  writeFileSync(join(distDir, "vercel.json"), `${JSON.stringify(vercelHeaders(), null, 2)}\n`);

  const snippet = cacheBustSnippet(buildId, prefix);
  let patched = 0;
  for (const file of walkHtmlFiles(distDir)) {
    let html = readFileSync(file, "utf8");
    if (html.includes("gitpress-build-check")) continue;
    if (html.includes("</head>")) html = html.replace("</head>", `${snippet}</head>`);
    else if (html.includes("</HEAD>")) html = html.replace("</HEAD>", `${snippet}</HEAD>`);
    else continue;
    writeFileSync(file, html);
    patched += 1;
  }
  log(`Injected cache-bust (id ${buildId}) into ${patched} HTML file(s).`);
}

function posixPrefix(basePath) {
  if (!basePath || basePath === "/") return "";
  const value = String(basePath);
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function walkHtmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === "." || name === "..") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkHtmlFiles(p));
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

function vercelHeaders() {
  const html = [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }];
  return {
    headers: [
      { source: "/", headers: html },
      { source: "/index.html", headers: html },
      { source: "/:path(.*).html", headers: html },
      { source: "/gitpress-build.json", headers: html },
      { source: "/sw.js", headers: html },
    ],
  };
}

function cacheBustSnippet(buildId, prefix) {
  const meta = `${prefix}/gitpress-build.json`;
  const sw = `${prefix}/sw.js`;
  const scope = prefix ? `${prefix}/` : "/";
  return `<script id="gitpress-build-check">(function(){var BUILD_ID=${JSON.stringify(buildId)};var META=${JSON.stringify(meta)};var SW=${JSON.stringify(sw)};var SCOPE=${JSON.stringify(scope)};try{if("serviceWorker"in navigator)navigator.serviceWorker.register(SW,{scope:SCOPE});}catch(e){}fetch(META+(META.indexOf("?")>=0?"&":"?")+"t="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(meta){if(!meta||!meta.id||meta.id===BUILD_ID)return;var key="gp-bust:"+meta.id;try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,"1");}catch(e){}if(typeof caches!=="undefined"){caches.keys().then(function(keys){return Promise.all(keys.map(function(k){return caches.delete(k);}));}).finally(function(){location.reload();});}else{location.reload();}}).catch(function(){});})();</script>`;
}

function serviceWorkerSource() {
  return `self.addEventListener("install",function(){self.skipWaiting();});
self.addEventListener("activate",function(event){event.waitUntil(self.clients.claim());});
self.addEventListener("fetch",function(event){
  if(event.request.mode!=="navigate")return;
  event.respondWith(fetch(event.request,{cache:"no-store"}).catch(function(){return caches.match(event.request);}));
});
`;
}

