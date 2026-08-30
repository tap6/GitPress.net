# GitPress 主题制作约定(spec v1)

给人类作者和 AI 的同一份说明书。按这份约定做出来的 Astro 主题,可以在 GitPress.net 后台用 GitHub 仓库地址导入,也可以将来放到主题商店。站长从后台复制的提示词见 `apps/web/src/lib/themePrompt.ts`,必须与本文同步。

## 最低要求

1. 根目录有 `theme.json`(见 `schemas/theme.schema.json`):`specVersion` 为 `1`,`engine` 为 `"astro"`,`name` 为小写短标识,`version` 为主题自身的 semver。`configSchema` 推荐提供(后台「外观」页按它生成表单),但不是硬性必填。`preview` 指向包内预览图(推荐 `preview.svg`),GitPress.net 外观页和创建站点时会显示。
2. 普通 Astro 项目:`package.json` 能 `npx astro build`。
3. 构建时 GitPress Action 会把数据仓库挂进主题项目,路径不可改:

| 数据仓库 | 主题内挂载点 |
| --- | --- |
| `gitpress.json` | `gitpress.config.json` |
| `content/`(`posts/`、`pages/`) | `user-content/` |
| `media/` | `public/media/` |

4. 从 `gitpress.config.json` 读 `site` 与 `theme.config`。`theme.config` 里缺的键必须有默认值,老站点升级主题后仍能构建。
5. `astro.config` 的 `site` / `base` 要读配置里的 `site.url` 与 `site.basePath`(GitHub Pages 项目站是 `/<repo>/`)。
6. 用 Astro content collections 读 `user-content/posts` 与 `user-content/pages`。

## 文章与页面

**文章** `content/posts/*.md` → `user-content/posts/`,公开地址 `/posts/{slug}/`。

- `title` 必填。
- `date` 为 ISO 8601 本地时间,如 `2026-08-30T14:05:00`;仅日期 `2026-08-30` 也兼容。没有 `date`、`draft: true`、或 `date` 晚于构建时刻,都不得出现在公开构建,除非 `GITPRESS_INCLUDE_DRAFTS=true`。
- 可选:`updated`、`draft`、`tags`、`categories`、`description`、`cover`、`slug`、`redirectFrom`。
- `slug` 覆盖由文件名推导的标识。`redirectFrom` 是旧 slug 列表,主题必须为每个旧 slug 再生成一条静态 301 跳转(`Astro.redirect`)到当前地址。

**独立页面** `content/pages/*.md` → `user-content/pages/`,公开地址 `/{slug}/`(不是 `/posts/`)。

- frontmatter:`title`(必填)、`description?`、`slug?`、`redirectFrom?`。
- 页面没有草稿、没有日期,始终进入公开构建。不要用文章的 draft/date 规则过滤页面。

未知 frontmatter 键用 `.passthrough()` 原样保留。

## 必须实现的路由

| 路由 | 说明 |
| --- | --- |
| `/`、`/{n}/` | 首页分页,每页 `site.postsPerPage`(缺省 10) |
| `/posts/{slug}/` | 文章 |
| `/{slug}/` | 独立页面 |
| `/categories/{slug}/` | 分类归档(分页) |
| `/tags/{tag}/` | 标签归档 |
| `/rss.xml` | RSS 2.0,建议最新 20 篇 |
| `/search/` | 站内搜索(Pagefind UI) |

不要把 `posts`、`categories`、`tags`、`rss`、`archive`、`media`、`search` 这些根路径段当作页面 slug。

## 站点字段主题必须认识

- `site.title` / `site.description` / `site.language` / `site.author` / `site.url` / `site.basePath` / `site.timezone`
- `site.logo` / `site.avatar`(路径通常是 `/media/...`;没有就不要渲染空 `<img>`)
- `site.nav`(有则严格按数组渲染顶栏,不要再拼分类或页面)
- `site.categories` + `inNav`(仅当 **没有** `site.nav` 时用于隐式顶栏;每个分类仍要有归档页)
- `site.footer`(有则严格按数组渲染页脚槽;没有则用默认:版权 + GitPress + 主题署名 + RSS)
- `site.beian`(有 `icp` / `gongan` 则追加在页脚末尾,不要放进 `theme.config`)
- `site.analyticsSnippet`(原样插入 `</head>` 前)
- `site.comments.enabled`(独立开关。缺省时:有 `comments.giscus` 或 `commentsSnippet` 则视为开)
- `site.comments.giscus`(有则按字段拼 giscus `<script>`,不要 `set:html`)
- `site.commentsSnippet`(仅当没有 `giscus` 时原样插入每篇**文章**正文下方;独立页面默认不渲染)
- `site.postsPerPage`

隐式顶栏建议:`首页`(文案随 `site.language`) + `inNav` 分类 + 全部页面(按 title 字母序)。**不要**把 RSS 放进默认顶栏。页脚默认给 RSS 链接,但站长可以关掉;`<head>` 里始终保留 `<link rel="alternate" type="application/rss+xml">`,`/rss.xml` 始终生成。

顶栏末尾加一项「搜索」,链到 `/search/`,由 `theme.config.showSearch` 控制,缺省 true。不要把它做成 `site.nav` 的一种 type。缺省文案随语言:中文「搜索」、日文「検索」、其它 “Search”。`/search/` 页始终生成,关掉的只是顶栏入口。

日期显示年月日必须有。时分秒做成主题选项:`showListTime` 管列表(首页/分类/标签/归档,默认关),`showPostTime` 管文章页(默认开)。JSON-LD 和 `article:published_time` 仍用 ISO,不要跟这两个开关走。

`site.nav` 里每一项都可以有 `label` 覆盖显示名。首页缺省文案:中文「首页」、日文「ホーム」、其它 “Home”。菜单里指向已改名/删除的页面时跳过该项。

页脚系统槽:`copyright`(默认 `© {year} {site.title}`,不要用 GitHub 用户名)、`gitpress`(链到 https://gitpress.net,`rel="generator"`)、`theme`(链到本主题 `theme.json` 的 `homepage`,没有 homepage 则跳过)、`rss`。自定义只有 `page` / `link` / `text`。不认识的 type:有 url+label 当外链,只有 label 当纯文本。`theme.json` 请提供 `homepage`(开源仓库或介绍页)。公安备案用盾牌图标,文案「公网安备 {号}号」,查询链 `https://beian.mps.gov.cn/#/query/webSearch?recordcode={号}`;ICP 链 `https://beian.miit.gov.cn/`。`{year}` 在 copyright **和** text 槽都要替换。

## SEO 与构建 Action 注入的文件

主题在每页 `<head>` 输出:

- `<link rel="canonical">`
- Open Graph(`og:type` / `og:title` / `og:description` / `og:url` / `og:image`)
- Twitter Card
- 文章页 `article:published_time`
- JSON-LD(`BlogPosting` 或 `WebSite`)

文章页把 `cover`、`type="article"`、`publishedTime` 传给布局。绝对地址用 `site.url` 拼。

**不要**自己实现:

- `gitpress-build.json`、Service Worker、`vercel.json` 缓存头
- `sitemap.xml`、`robots.txt`
- Pagefind 索引(`npx pagefind`)

构建 Action 会在 `astro build` 之后注入这些产物,用来刷新缓存、给搜索引擎站点地图、以及生成 `/pagefind/` 索引。主题只需提供 `/search/` 页去加载 `/pagefind/pagefind-ui.js` 与 `pagefind-ui.css`(用 `withBase` 拼路径,并设置 `bundlePath`)。`pagefind-ui.js` 是全局脚本(`window.PagefindUI`),用 `<script is:inline src>` 加载,不要 `import()`。正文容器加 `data-pagefind-body`;页眉页脚加 `data-pagefind-ignore`。不要把 `pagefind` 写进主题的 `package.json`。

## 主题自己的选项:`configSchema`

写在 `theme.json` 里,后台按 JSON Schema 自动生成表单。推荐至少提供:

- `showLogo`(boolean,默认 true)
- `showAvatar`(boolean,默认 false)
- `showTitle`(boolean,默认 true)
- `showTagline`(boolean,默认 true)
- `showSearch`(boolean,默认 true)
- `showListTime`(boolean,默认 false;列表年月日必有,时分秒可关)
- `showPostTime`(boolean,默认 true;文章页年月日必有,时分秒可关)
- 以及主题自己真正在用的东西(`accentColor`、`showExcerpts`、暗色模式等)

boolean 渲染为开关,`format: "color"` 渲染为取色器,带 `enum` 的字符串渲染为下拉框。

## 发布与导入

把主题推到任意 **公开** GitHub 仓库(可以在子目录,例如 `themes/my-theme`)。站长在 GitPress 外观页粘贴仓库 URL 即可。`theme.source` 格式:

```
github:<owner>/<repo>[/<subdir>]#<ref>
```

`theme.name` 必须等于 `theme.json` 的 `name`。
