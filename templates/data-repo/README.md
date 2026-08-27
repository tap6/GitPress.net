# {{SITE_TITLE}} — GitPress data repository

This private repository holds the **content** of your GitPress site:

```
gitpress.json      site + theme configuration
content/posts/     blog posts (Markdown; draft: true = private)
content/pages/     standalone pages (about, contact, ...)
media/             images and other assets
```

Every push to `main` triggers the GitPress build action, which compiles your
site with the theme pinned in `gitpress.json` and publishes the result to your
public site repository: **{{SITE_REPO}}**.

Manage everything comfortably at [GitPress.net](https://gitpress.net), or edit
files directly — it is your repository.
