---
title: Hello, GitPress
date: 2026-08-27
tags: [gitpress, demo]
description: A sample post used for local theme development. Real sites replace this folder at build time.
---

This is a **sample post** bundled with the theme for local development.

When a real site is built, the GitPress build action wipes `user-content/` and
copies the content of your private data repository here.

## Writing

Posts are plain Markdown with frontmatter:

```yaml
---
title: My first post
date: 2026-08-27
draft: true
---
```

Drafts (`draft: true`) never leave your private data repository.

## What's different about Quill

- **Cards, not a plain list** — the homepage and archive pages show posts as
  cards with an optional cover image, tags, and an estimated reading time.
- **Light/dark toggle** — the sun/moon button in the header remembers each
  visitor's choice; site owners can also set the initial appearance.
- **Archive page** — every post, grouped by year, at `/archive/`.

> Content and presentation live in separate repositories — switch themes any
> time without touching your writing.
