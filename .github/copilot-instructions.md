# GitPress.net

Git-native blogging platform. Content and compiled output live in the *user's own* GitHub
repositories; GitPress.net is only the control plane (login, WordPress-style admin, GitHub API
orchestration). All builds run in GitHub Actions, so the platform server stays near-zero-load.

## Architecture

```
Browser ── GitPress.net (Next.js on Vercel, closed source, apps/web)
              │  GitHub App API (commits Markdown / images / config)
              ▼
      DATA repo (private) ── push triggers ──▶ GitHub Actions (packages/build-action)
      content/ media/ gitpress.json                  │ Astro build, drafts excluded
                                                       ▼
                                          SITE repo (public, compiled output)
                                                       ▼
                                          GitHub Pages / Vercel hosting
```

Every GitPress site is **two GitHub repos**, tracked by one row in the `sites` table
([schema.ts](/Users/uxn/CursorProjects/GitPress.net.worktrees/ui-system-user-participation/apps/web/src/db/schema.ts)):
- **Data repo** (private by default): `gitpress.json`, `content/posts/*.md`, `content/pages/*.md`,
  `media/`, and a thin `.github/workflows/gitpress-build.yml`. Drafts (`draft: true` or missing
  `date`) never leave this repo.
- **Site repo** (public): only the compiled static output, pushed there by the build action. Free
  GitHub Pages requires a public repo, which is the whole reason for the two-repo split.

This means a change that looks like "add a field" usually touches four packages in this order:
1. [packages/spec](/Users/uxn/CursorProjects/GitPress.net.worktrees/ui-system-user-participation/packages/spec) — add the (optional, additive) field to the TypeScript types in `src/index.ts` **and** the matching JSON Schema under `schemas/`.
2. [packages/build-action](/Users/uxn/CursorProjects/GitPress.net.worktrees/ui-system-user-participation/packages/build-action) — `scripts/build.mjs` reads/validates `gitpress.json` and mounts data-repo files into the theme project.
3. [themes/*](/Users/uxn/CursorProjects/GitPress.net.worktrees/ui-system-user-participation/themes) (classic / minimal / ink) — Astro sites that read `gitpress.config.json` + `user-content/` and must default any new/missing config option.
4. [apps/web](/Users/uxn/CursorProjects/GitPress.net.worktrees/ui-system-user-participation/apps/web) — the admin UI that writes `gitpress.json` / content into the user's data repo via the GitHub App.

### Compatibility contract (load-bearing, do not break casually)
- `schemaVersion` (site config) / `specVersion` (theme manifest) bump **only** on breaking changes;
  new fields are always optional additions.
- Consumers (build action, themes, platform) must **ignore unknown fields**, never error on them.
- The build action refuses to build an unsupported `schemaVersion`/`specVersion` rather than guess
  (see the `fail(...)` calls at the top of `build.mjs`).
- Themes must supply defaults for missing `config` options so older sites keep building after a
  theme upgrade.
- Released artifacts are tag-pinned: sites reference `owner/build-action@v1` and
  `theme.source: "builtin"` resolves against `GITPRESS_THEMES_REPO@v1` (or an explicit `ref`).
  Breaking changes ship only under a new major tag (`@v2`); `@v1` must stay backward compatible
  forever.

### Theme mount points (build action ↔ theme project)
Defined once as `THEME_MOUNT_POINTS` in `packages/spec/src/index.ts` and applied by both
`packages/build-action/scripts/build.mjs` and `packages/build-action/scripts/prepare-local.mjs`:

| Data repo | Theme project |
| --- | --- |
| `gitpress.json` | `gitpress.config.json` |
| `content/` | `user-content/` |
| `media/` | `public/media/` |

### Theme source resolution (`theme.source` in `gitpress.json`)
- `"builtin"` — clone `GITPRESS_THEMES_REPO` (default `tap6/gitpress`) at tag `theme.ref ?? "v1"`,
  use `themes/<name>`.
- `"github:<owner>/<repo>[/<subdir>]#<ref>"` — clone that repo/ref directly.
- `"npm:..."` — reserved by the spec, not yet implemented; the build action explicitly rejects it.

### apps/web (the platform, closed source)
- Next.js 15 (App Router) + React 19, Auth.js v5 (`next-auth`) for login, Drizzle ORM + Postgres
  for **metadata only** (users, `github_installation`, `site`, `ai_settings` — never blog content).
- `src/lib/github.ts` wraps the GitHub App (via `octokit`'s `App`) — installation tokens, deploy-key
  generation (`tweetnacl` + libsodium sealed boxes for Actions secrets), permission-gap detection
  (GitHub never auto-upgrades an installation's granted scopes when the App's requested permissions
  change; `getInstallationPermissionGap` diffs `GET /app` vs. the installation to drive the
  "approve on GitHub" banner).
- `src/lib/provision.ts` creates a new site: data repo + site repo, deploy key, Pages, workflow file.
- `src/lib/actions.ts` holds the `"use server"` Server Actions the UI calls; it composes the smaller
  `lib/*.ts` modules (content, categories, media, themes, ai, provision) rather than doing GitHub
  API calls inline.
- Secrets at rest (currently only per-user AI provider API keys) are encrypted with
  `encryptSecret`/`decryptSecret` in `src/lib/crypto.ts` (NaCl secretbox, key from
  `GITPRESS_SECRET_KEY`) before hitting Postgres.
- Path alias `@/*` → `apps/web/src/*` (see `tsconfig.json`).

## Build / dev commands

Package manager is **pnpm** (`packageManager: pnpm@10.2.0`, workspaces = `apps/*`, `packages/*`,
`themes/*`). Node >= 20.

```bash
pnpm install                                   # from repo root
pnpm dev                                        # runs apps/web (pnpm --filter @gitpress/web dev)
pnpm build                                      # builds apps/web
pnpm typecheck                                   # runs `typecheck` in every workspace package that has one
```

- `apps/web`: `pnpm --filter @gitpress/web dev|build|start|typecheck`; `db:generate`/`db:push` run
  `drizzle-kit` against `DATABASE_URL` (copy `apps/web/.env.example` to `.env.local` first).
- `packages/spec`: `pnpm --filter @gitpress/spec typecheck` (types + JSON Schemas only, no build
  step — consumed straight from `src/index.ts`).
- `themes/*`: each is a standalone Astro project — `pnpm --filter @gitpress/theme-classic dev|build|preview`.
- There is no test suite and no lint script/config in this repo currently; don't invent one unless
  asked — `pnpm lint` at the root is a no-op today.

### Previewing a theme locally (no GitHub credentials needed)
```bash
node packages/build-action/scripts/prepare-local.mjs themes/classic templates/data-repo
pnpm --filter @gitpress/theme-classic dev
```
This mounts `templates/data-repo` into the theme the same way the real build action does
(`user-content/`, `public/media/`, `gitpress.config.json`), substituting `{{PLACEHOLDER}}` tokens
with dev-friendly defaults. The mounted files are gitignored (`themes/*/gitpress.config.json`,
`themes/*/public/media/`) — never hand-edit them; re-run the script instead.

## Key conventions

- **Chinese-language docs**: `README.md`, `docs/platform-setup.md`, and `docs/site-deployment.md`
  are written in Chinese (the maintainer's primary language); code comments and identifiers are in
  English. Match the existing language when editing a given file.
- **`gitpress.json` / `theme.json` are the only cross-package contract** — when adding a field,
  update `packages/spec` (types + JSON Schema) first, then propagate to the build action and themes.
  Never read/write these files' shapes ad hoc from `apps/web` without going through `@gitpress/spec`.
- **Everything user-authored stays in the user's repos.** Postgres in `apps/web` is strictly
  control-plane metadata (accounts, installation/site mappings, encrypted AI keys) — never cache
  post content or media there as the source of truth.
- **Version pinning everywhere**: build action calls, `theme.source: "builtin"` resolution, and the
  data-repo workflow template (`templates/data-repo/.github/workflows/gitpress-build.yml`) all pin
  to `@v1`. Don't add code paths that float to `latest`/`main`.
- **`.env.example` is the source of truth for required environment variables** for `apps/web`;
  keep it in sync when adding new env vars, including a short comment on where/how to obtain them.
