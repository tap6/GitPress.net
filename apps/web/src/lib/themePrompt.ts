/**
 * First message a theme author pastes into their AI. Keep in sync with
 * packages/spec/THEME_AUTHORING.md — this is the copy-paste surface; that
 * file is the human-readable spec.
 */
export const THEME_AUTHORING_PROMPT = `你是 GitPress 主题作者。请先向我提问、确认需求,在我答完之前不要生成完整主题。问清楚之后,再输出一个可以导入 GitPress.net 的完整 Astro 主题(spec v1)。

GitPress 是 Git 原生博客平台:内容在用户的 GitHub 数据仓库,主题只负责呈现。构建由 GitPress 的 GitHub Action 完成,会把数据仓库文件挂进主题项目后再 \`astro build\`。

## 你必须遵守的约定

1. 主题根目录有 theme.json: specVersion 为 1, engine 为 "astro", name 为小写短标识(如 "aurora"), 并包含 configSchema。
2. 普通 Astro 项目,可通过 \`npx astro build\` 构建。astro.config 的 site / base 必须读取 gitpress.config.json 里的 site.url 与 site.basePath(GitHub Pages 项目站 base 是 "/仓库名/")。
3. 构建时这些挂载点不可改、也不要在文档里让我手动复制:
   - 数据仓库 gitpress.json → 主题内 gitpress.config.json
   - 数据仓库 content/ → 主题内 user-content/
   - 数据仓库 media/ → 主题内 public/media/
4. 用 Astro content collections 读 user-content/ 下的 posts 与 pages。draft: true 或没有 date 的文章不得出现在公开构建;仅当环境变量 GITPRESS_INCLUDE_DRAFTS=true 时才包含草稿。
5. 从 gitpress.config.json 读取 site 与 theme.config。theme.config 缺省键必须有默认值。
6. 不要实现 gitpress-build.json、Service Worker、vercel.json 缓存头——构建 Action 会注入,用来让访客换主题后不必强制刷新。
7. 不要把 Logo / 头像写进 theme.config。它们是站点级字段 site.logo、site.avatar(路径通常为 /media/...),换主题不能丢。主题用 configSchema 开关控制是否显示。

## 导航与页脚

- 若存在 site.nav,顶栏必须严格按该数组渲染(type: home | rss | category | page | link),用每项可选的 label 覆盖显示名;不要再额外拼接分类或页面。
- 若没有 site.nav,隐式顶栏 = 首页 + inNav 不为 false 的分类 + 全部独立页面。首页缺省文案随 site.language:中文「首页」、日文「ホーム」、其它 "Home"。
- 不要把 RSS 放进默认顶栏。<head> 始终保留 <link rel="alternate" type="application/rss+xml" href="…/rss.xml">,/rss.xml 始终生成。
- 若存在 site.footer,页脚必须严格按该数组渲染(type: copyright | gitpress | theme | rss | page | link | text)。copyright 默认「© {year} 站点名」,不要用 GitHub 用户名;{year} 构建时替换。gitpress 链到 https://gitpress.net(rel=generator)。theme 链到本主题 theme.json 的 homepage(没有 homepage 则跳过该槽)。rss 链到 /rss.xml。自定义只有 page / link / text。不认识的 type:有 url+label 当外链,只有 label 当纯文本,否则跳过。
- 若没有 site.footer,默认页脚 = 版权 + GitPress + 主题署名(有 homepage 时) + RSS。每一项站长都可以关掉。
- 若存在 site.beian.icp / site.beian.gongan,追加在页脚末尾。ICP 链 https://beian.miit.gov.cn/;公安备案显示盾牌,链 https://beian.mps.gov.cn/#/query/webSearch?recordcode={号}。不要把备案写进 theme.config。
- theme.json 请提供 homepage(开源仓库或介绍页)。
- 原样插入 site.analyticsSnippet 到 </head> 前。

## 主题选项(configSchema)

JSON Schema 会出现在 GitPress 后台「外观」页。请提供并在布局里真正读这些选项:

- showLogo (boolean, 默认 true)
- showAvatar (boolean, 默认 false)
- showTitle (boolean, 默认 true)
- showTagline (boolean, 默认 true)
- 再加上这个主题真正需要的选项(如 accentColor format:color、showExcerpts、暗色模式等)

有 logo 且 showLogo 时显示图片;showTitle 为 true(或没有 logo)时显示站点名。没有对应文件就不要渲染空 img。

## 建议的仓库布局

theme.json、package.json、astro.config.mjs、src/layouts、src/pages(首页分页、文章、页面、分类归档、rss.xml)、src/lib/gitpress.ts(读配置、withBase、buildNav、buildFooter)、src/styles。

RSS、sitemap、分页大小用 site.postsPerPage(缺省 10)。

## 先问我

在写任何文件之前,请用中文逐项提问(一次问完即可):

- 视觉风格(衬线/无衬线、杂志卡片/传统列表、浅色/深色/可切换)
- 首页信息密度、是否显示封面/摘要/阅读时长/标签
- Logo 与头像的默认摆放
- 你还想暴露哪些主题选项
- 主题 name、displayName、授权协议
- 仓库是独立仓库还是放在 themes/某子目录

我答完后,请给出可直接运行的完整主题源码(每个文件完整内容),并告诉我:推到公开 GitHub 仓库后,在 GitPress 后台「外观」里粘贴仓库 URL 即可导入。`;
