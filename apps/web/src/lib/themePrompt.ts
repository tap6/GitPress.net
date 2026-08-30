/**
 * First message a theme author pastes into their AI. Keep in sync with
 * packages/spec/THEME_AUTHORING.md — this is the copy-paste surface; that
 * file is the human-readable spec.
 */
export const THEME_AUTHORING_PROMPT = `你是 GitPress 主题作者。请先向我提问、确认需求,在我答完之前不要生成完整主题。问清楚之后,再输出一个可以导入 GitPress.net 的完整 Astro 主题(spec v1)。

GitPress 是 Git 原生博客平台:内容在用户的 GitHub 数据仓库,主题只负责呈现。构建由 GitPress 的 GitHub Action 完成,会把数据仓库文件挂进主题项目后再 \`astro build\`。

## 你必须遵守的约定

1. 主题根目录有 theme.json: specVersion 为 1, engine 为 "astro", name 为小写短标识(如 "aurora"), version 为主题自身的 semver。推荐提供 configSchema(JSON Schema),后台「外观」页会按它生成表单;不是硬性必填,但没有就无法在后台调选项。推荐提供 preview 指向包内预览图(通常是 preview.svg),以及 author。GitPress.net 外观页会显示预览和作者;官方内置带「官方」角标,商店上架带「已收录」。
2. 普通 Astro 项目,可通过 \`npx astro build\` 构建。astro.config 的 site / base 必须读取 gitpress.config.json 里的 site.url 与 site.basePath(GitHub Pages 项目站 base 是 "/仓库名/")。
3. 构建时这些挂载点不可改、也不要在文档里让我手动复制:
   - 数据仓库 gitpress.json → 主题内 gitpress.config.json
   - 数据仓库 content/ → 主题内 user-content/(其中 content/posts/ → user-content/posts/, content/pages/ → user-content/pages/)
   - 数据仓库 media/ → 主题内 public/media/
4. 用 Astro content collections 读 user-content/ 下的 posts 与 pages。
5. 从 gitpress.config.json 读取 site 与 theme.config。theme.config 缺省键必须有默认值。
6. 不要实现 gitpress-build.json、Service Worker、vercel.json 缓存头、sitemap.xml、robots.txt、pagefind 索引——构建 Action 会注入。
7. 不要把 Logo / 头像写进 theme.config。它们是站点级字段 site.logo、site.avatar(路径通常为 /media/...),换主题不能丢。主题用 configSchema 开关控制是否显示。

## 文章(posts)与页面(pages)

文章在 user-content/posts/*.md,公开地址是 /posts/{slug}/。frontmatter:
- title(必填)
- date:ISO 8601 本地墙钟,如 2026-08-30T14:05:00;仅日期 2026-08-30 也兼容。没有 date、draft: true、或 date 晚于站点时区(site.timezone,中文站默认 Asia/Shanghai)的当前墙钟,都不得出现在公开构建。不要用构建机 UTC 的 Date.now() 去比无时区的 date。仅当环境变量 GITPRESS_INCLUDE_DRAFTS=true 时才包含这些文章。
- updated、draft、tags、categories、description、cover、slug、redirectFrom 可选。
- slug 覆盖由文件名推导的标识;redirectFrom 是旧 slug 列表,主题必须为每个旧 slug 再生成一条静态跳转(Astro.redirect 301)到当前地址。

独立页面在 user-content/pages/*.md,公开地址是 /{slug}/(不是 /posts/)。frontmatter 只有 title(必填)、description?、slug?、redirectFrom?。页面没有草稿、没有日期,始终进入公开构建。不要用文章的 draft/date 规则过滤页面。

slug 缺省由文件名推导。未知 frontmatter 键用 .passthrough() 原样保留。

## 路由(必须实现)

- 首页分页:/ 与 /{n}/,每页条数 site.postsPerPage(缺省 10)
- 文章:/posts/{slug}/
- 独立页面:/{slug}/
- 分类归档:/categories/{slug}/(分页)
- 标签归档:/tags/{tag}/
- RSS:/rss.xml(建议取最新 20 篇)
- 搜索页:/search/(见下方)。不要占用 posts、categories、tags、rss、archive、media、search 这些根路径当页面 slug。

## 导航与页脚

- 若存在 site.nav,顶栏必须严格按该数组渲染(type: home | rss | category | page | link),用每项可选的 label 覆盖显示名;不要再额外拼接分类或页面。
- 若没有 site.nav,隐式顶栏 = 首页 + inNav 不为 false 的分类 + 全部独立页面(按 title 字母序)。首页缺省文案随 site.language:中文「首页」、日文「ホーム」、其它 "Home"。
- 顶栏末尾加一项「搜索」,链到 /search/;由 theme.config.showSearch 控制,缺省 true。不要把它做成 site.nav 的一种 type。缺省文案:中文「搜索」、日文「検索」、其它 "Search"。/search/ 页始终生成,关掉的只是顶栏入口。
- 日期显示年月日必须有。时分秒用 theme.config.showListTime(列表,默认关)和 showPostTime(文章页,默认开)。JSON-LD / article:published_time 仍用 ISO。
- 不要把 RSS 放进默认顶栏。<head> 始终保留 <link rel="alternate" type="application/rss+xml" href="…/rss.xml">,/rss.xml 始终生成。
- 若存在 site.footer,页脚必须严格按该数组渲染(type: copyright | gitpress | theme | rss | page | link | text)。copyright 默认「© {year} 站点名」,不要用 GitHub 用户名;{year} 构建时替换。gitpress 链到 https://gitpress.net(rel=generator)。theme 链到本主题 theme.json 的 homepage(没有 homepage 则跳过该槽)。rss 链到 /rss.xml。自定义只有 page / link / text。不认识的 type:有 url+label 当外链,只有 label 当纯文本,否则跳过。
- 若没有 site.footer,默认页脚 = 版权 + GitPress + 主题署名(有 homepage 时) + RSS。每一项站长都可以关掉。
- 若存在 site.beian.icp / site.beian.gongan,追加在页脚末尾。ICP 链 https://beian.miit.gov.cn/;公安备案显示盾牌,文案「公网安备 {号}号」,链 https://beian.mps.gov.cn/#/query/webSearch?recordcode={号}。不要把备案写进 theme.config。
- theme.json 请提供 homepage(开源仓库或介绍页)。
- 原样插入 site.analyticsSnippet 到 </head> 前。不要解析 site.analytics(那是平台配置,构建器会把已开启的项编译进 snippet)。
- 评论区只出现在文章页(独立页面默认不渲染)。site.comments.enabled 为关则不渲染。enabled 缺省时:有 comments.giscus 或 commentsSnippet 则视为开。有 comments.giscus 时按字段拼 giscus 脚本(data-repo / data-repo-id / data-category / data-category-id,mapping 用 pathname);否则若存在 site.commentsSnippet 再原样渲染。

## SEO(主题必须输出,sitemap/robots 由 Action 注入)

每页 <head> 提供:
- <link rel="canonical">
- Open Graph: og:type(文章 article,其它 website)、og:title、og:description、og:url、有封面或 logo 时 og:image
- Twitter Card: summary_large_image 或 summary
- 文章页 article:published_time
- JSON-LD:文章 BlogPosting,其它页 WebSite

封面、canonical、og:image 尽量用 site.url 拼成绝对地址。文章页把 cover / type="article" / publishedTime 传给布局。

## 搜索

提供 /search/ 页,用 Pagefind Default UI(不要把 pagefind 写进 package.json)。构建 Action 会在 dist/ 上跑 pagefind,产物在 /pagefind/pagefind-ui.js 与 pagefind-ui.css。pagefind-ui.js 是全局脚本(window.PagefindUI),用 <script is:inline src> 加载,不要 import()。用 withBase 拼路径,并设置 bundlePath。正文容器加 data-pagefind-body;页眉页脚加 data-pagefind-ignore。索引缺失时给一句访客可读的降级说明,不要写「本地预览」。

## 主题选项(configSchema)

JSON Schema 会出现在 GitPress 后台「外观」页。请提供并在布局里真正读这些选项:

- showLogo (boolean, 默认 true)
- showAvatar (boolean, 默认 false)
- showTitle (boolean, 默认 true)
- showTagline (boolean, 默认 true)
- showSearch (boolean, 默认 true)
- showListTime (boolean, 默认 false;列表只保证年月日,打开才带时分秒)
- showPostTime (boolean, 默认 true;文章页年月日必须有,打开才带时分秒)
- 再加上这个主题真正需要的选项(如 accentColor format:color、showExcerpts、暗色模式等)

有 logo 且 showLogo 时显示图片;showTitle 为 true(或没有 logo)时显示站点名。没有对应文件就不要渲染空 img。

## 建议的仓库布局

theme.json、package.json、astro.config.mjs、src/layouts/Base.astro、src/pages(首页分页、文章、页面、分类归档、标签归档、rss.xml、search)、src/lib/gitpress.ts(读配置、withBase、buildNav、buildFooter、getPublishedPosts)、src/components/SearchBox.astro、src/styles。

## 先问我

在写任何文件之前,请用中文逐项提问(一次问完即可):

- 视觉风格(衬线/无衬线、杂志卡片/传统列表、浅色/深色/可切换)
- 首页信息密度、是否显示封面/摘要/阅读时长/标签
- Logo 与头像的默认摆放
- 你还想暴露哪些主题选项
- 主题 name、displayName、授权协议
- 仓库是独立仓库还是放在 themes/某子目录

我答完后,请给出可直接运行的完整主题源码(每个文件完整内容),并告诉我:推到公开 GitHub 仓库后,在 GitPress 后台「外观」里粘贴仓库 URL 即可导入。`;
