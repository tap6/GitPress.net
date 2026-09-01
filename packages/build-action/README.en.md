# tap6/build-action

[![MIT](https://img.shields.io/github/license/tap6/build-action?label=License)](LICENSE)
[![v1](https://img.shields.io/github/v/tag/tap6/build-action?label=Tag)](https://github.com/tap6/build-action/tags)

**The GitPress compiler: turn posts in your private repo into a static site.** Not the admin. [MIT](LICENSE).

It runs in GitHub Actions on your data repository, not on gitpress.net machines. Pin `@v1`. Do not use `@main`.

[中文](README.md) | English

In the data-repo workflow it: reads `gitpress.json` → fetches the pinned theme → applies `site.timezone` to naive dates → Astro build (drafts excluded by default) → pushes output to the public site repository.

Themes and conventions: [tap6/gitpress](https://github.com/tap6/gitpress) (MIT). Control plane: [tap6/GitPress.net](https://github.com/tap6/GitPress.net) (PolyForm Shield).

## Usage

In the data repository `.github/workflows/`:

```yaml
- uses: tap6/build-action@v1
  with:
    site-repo: alice/my-blog-site
    deploy-key: ${{ secrets.GITPRESS_DEPLOY_KEY }}
```

| Input | Meaning |
| --- | --- |
| `site-repo` | Required, `owner/name`, where compiled output is pushed |
| `deploy-key` | SSH deploy key with write access to the site repo (set up by GitPress) |
| `site-token` | Alternative to `deploy-key`: a token with contents write access |
| `themes-repo` | Builtin-theme repo, default `tap6/gitpress` |
| `include-drafts` | Include drafts (preview only; keep false for public sites) |

## Compatibility

- This Action only understands `schemaVersion: 1`. A higher version is **rejected**, not guessed.
- Breaking changes ship under a new major tag (`@v2`). `@v1` stays backward compatible.
- Theme sources: `builtin` and `github:<owner>/<repo>[/<subdir>]#<ref>`. `npm:` is reserved in the spec.

## Editing this Action in the GitPress.net monorepo

This file is both the root README of `tap6/build-action` and `packages/build-action/` in the monorepo. The commands below only work from the **[tap6/GitPress.net](https://github.com/tap6/GitPress.net)** repository root, not from this Action repo’s root.

```bash
node packages/build-action/scripts/prepare-local.mjs themes/classic templates/data-repo
pnpm --filter @gitpress/theme-classic dev
```
