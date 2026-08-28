# GitPress 主题制作约定(spec v1)

给人类作者和 AI 的同一份说明书。按这份约定做出来的 Astro 主题,可以在 GitPress.net 后台用 GitHub 仓库地址导入,也可以将来放到主题商店。

## 最低要求

1. 根目录有 `theme.json`(见 `schemas/theme.schema.json`),`specVersion` 为 `1`,`engine` 为 `"astro"`。
2. 普通 Astro 项目:`package.json` 能 `npx astro build`。
3. 构建时 GitPress Action 会把数据仓库挂进主题项目,路径不可改:

| 数据仓库 | 主题内挂载点 |
| --- | --- |
| `gitpress.json` | `gitpress.config.json` |
| `content/` | `user-content/` |
| `media/` | `public/media/` |

4. 从 `gitpress.config.json` 读 `site` 与 `theme.config`。`theme.config` 里缺的键必须有默认值,老站点升级主题后仍能构建。
5. `astro.config` 的 `site` / `base` 要读配置里的 `site.url` 与 `site.basePath`(GitHub Pages 项目站是 `/<repo>/`)。
6. 文章用 Astro content collections,根目录指向 `user-content/`。草稿(`draft: true` 或没有 `date`)不得出现在公开构建里,除非构建器设置了 `GITPRESS_INCLUDE_DRAFTS=true`。

## 站点字段主题必须认识

- `site.title` / `site.description` / `site.language` / `site.author`
- `site.logo` / `site.avatar`(路径通常是 `/media/...`;没有就不要渲染空 `<img>`)
- `site.nav`(有则严格按数组渲染顶栏,不要再拼分类或页面)
- `site.categories` + `inNav`(仅当 **没有** `site.nav` 时用于隐式顶栏)
- `site.analyticsSnippet`(原样插入 `</head>` 前)
- `site.postsPerPage`

隐式顶栏建议:`首页`(文案随 `site.language`) + `inNav` 分类 + 全部页面。**不要**把 RSS 放进默认顶栏;页脚给 RSS 链接,`<head>` 里保留 `<link rel="alternate" type="application/rss+xml">`。

`site.nav` 里每一项都可以有 `label` 覆盖显示名。首页缺省文案:中文「首页」、日文「ホーム」、其它 “Home”。

## 主题自己的选项:`configSchema`

写在 `theme.json` 里,后台按 JSON Schema 自动生成表单。推荐至少提供:

- `showLogo`(boolean,默认 true)
- `showAvatar`(boolean,默认 false)
- `showTitle`(boolean,默认 true)
- `showTagline`(boolean,默认 true)
- 以及主题自己真正在用的东西(`accentColor`、`showExcerpts`、暗色模式等)

**不要**实现 `gitpress-build.json` 或 Service Worker:构建 Action 会在编译产物里注入,用来让访客在换主题后不必强制刷新。

## 发布与导入

把主题推到任意 **公开** GitHub 仓库(可以在子目录,例如 `themes/my-theme`)。站长在 GitPress 外观页粘贴仓库 URL 即可。`theme.source` 格式:

```
github:<owner>/<repo>[/<subdir>]#<ref>
```

`theme.name` 必须等于 `theme.json` 的 `name`。
