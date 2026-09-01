# gitpress

[![MIT](https://img.shields.io/github/license/tap6/gitpress?label=License)](LICENSE)
[![v1](https://img.shields.io/github/v/tag/tap6/gitpress?label=Tag)](https://github.com/tap6/gitpress/tags)

**Themes and conventions for GitPress blogs: how Markdown is written and how a site looks.** [MIT](LICENSE).

Sites pin this repo at `@v1`. Switching or authoring a theme follows the spec here. This is not the admin UI.

[中文](README.md) | English

The control plane (sign-in, writing, creating repos) lives in [tap6/GitPress.net](https://github.com/tap6/GitPress.net): source-available under PolyForm Shield, not closed source, and not MIT like this repo. Builds use [tap6/build-action](https://github.com/tap6/build-action) (also MIT).

The public-security 备案 badge in footers is the official emblem. Display it only as required by law; it is not relicensed under MIT.

## Layout

| Path | Contents |
| --- | --- |
| [`spec/`](spec/) | v1 spec: `gitpress.json` / `theme.json` JSON Schema, frontmatter, TypeScript types |
| [`spec/THEME_AUTHORING.md`](spec/THEME_AUTHORING.md) | How to make and import a theme |
| [`themes/`](themes/) | Builtin Astro themes: `classic`, `minimal`, `ink`, `quill` |
| [`templates/data-repo/`](templates/data-repo/) | Starting layout for a data repository |

The spec body is [`spec/README.md`](spec/README.md). That file is not this repository’s introduction.

## Related

- Admin: [tap6/GitPress.net](https://github.com/tap6/GitPress.net)
- Build: `uses: tap6/build-action@v1`
- Site: [https://gitpress.net](https://gitpress.net)

## Compatibility

- Config carries `schemaVersion` / `specVersion`. New fields are additive. Unknown fields must be ignored, not fatal.
- Breaking changes only appear under a new major tag (`v2`). This repo is `v1` and stays backward compatible.
