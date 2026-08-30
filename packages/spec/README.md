# @gitpress/spec — GitPress 规范 v1

GitPress 生态的共同契约:平台、构建 Action、所有主题(包括 AI 生成的主题)都以本包为准。

## 兼容性承诺

1. `schemaVersion` / `specVersion` 只在破坏性变更时递增;新增字段永远是可选的加法。
2. 消费方(构建器、主题、平台)必须忽略未知字段,而不是报错。
3. 构建器遇到不认识的版本必须拒绝构建并明确报错,而不是猜测。
4. 主题必须为缺失的 `config` 选项提供默认值,保证老站点在主题升级后仍能构建。

## 数据仓库布局(v1)

```
<data-repo>/
├── gitpress.json                 # 站点配置(见 schemas/gitpress.schema.json)
├── content/
│   ├── posts/                    # 文章,*.md,frontmatter 见下
│   └── pages/                    # 独立页面(如 about.md)
├── media/                        # 图片等静态资源,构建后挂载到 /media/...
└── .github/workflows/
    └── gitpress-build.yml        # 极薄 workflow,逻辑都在 build action 里
```

## 站点配置(`gitpress.json` 的 `site` 字段,v1 新增)

```json
{
  "site": {
    "title": "我的博客",
    "logo": "/media/logo.png",
    "avatar": "/media/avatar.png",
    "categories": [
      { "slug": "tech", "label": "技术" },
      { "slug": "notes", "label": "随笔", "inNav": false }
    ],
    "postsPerPage": 10,
    "analyticsSnippet": "<script>/* 由已开启的 analytics.providers 编译而来,主题原样插入 </head> 前 */</script>",
    "analytics": {
      "providers": [
        { "type": "ga4", "enabled": true, "measurementId": "G-XXXXXXXX", "dashboardUrl": "https://analytics.google.com/" }
      ]
    },
    "comments": {
      "enabled": true,
      "giscus": {
        "repo": "alice/my-blog",
        "repoId": "R_kgDOXXXX",
        "category": "Announcements",
        "categoryId": "DIC_kwDOXXXX",
        "mapping": "pathname",
        "lang": "zh-CN"
      }
    },
    "nav": [
      { "type": "home" },
      { "type": "category", "slug": "tech" },
      { "type": "page", "slug": "about", "label": "关于我" },
      { "type": "link", "url": "https://github.com/octocat", "label": "GitHub" },
      { "type": "rss" }
    ],
    "footer": [
      { "type": "copyright", "label": "© {year} 我的博客" },
      { "type": "gitpress" },
      { "type": "theme" },
      { "type": "rss" }
    ],
    "beian": {
      "icp": "京ICP备12345678号",
      "gongan": "11000002000001"
    }
  }
}
```

- `categories`:站长维护的有序分类列表。主题为每个分类生成 `/categories/<slug>/` 归档页。若尚未配置 `site.nav`,顶部导航只包含 `inNav` 不为 `false` 的项(缺省为 `true`);一旦存在 `site.nav`,顶栏完全由菜单决定,`inNav` 不再影响导航。每篇文章从这个列表选一个主分类(写入 frontmatter 的 `categories` 数组第 0 项),与自由的 `tags` 并存、互不影响。关掉顶栏不等于删除分类。
- `postsPerPage`:首页与归档页的分页大小,缺省 10。
- `analyticsSnippet`:主题原样插入 `</head>` 前的 HTML。缺省不注入任何统计代码。
- `analytics.providers`:平台维护的结构化统计项(`ga4` / `clarity` / `cloudflare` / `baidu` / `umami` / `51la` / `custom`)。`enabled` 为关时仍保存在数据仓,但不编入公开站。主题**不要**读这个对象;构建器把已开启的项编译进 `analyticsSnippet`。旧站只有手贴的 snippet、没有 `analytics` 时行为不变。
- `comments.enabled`:站点级评论开关。关掉只是不渲染,不删除 `giscus` 配置。缺省时:已连接 giscus 或仍有 `commentsSnippet` 则视为开启。
- `comments.giscus`:平台一键连接后写入的仓库 / 分类 ID。主题按字段拼 giscus 脚本,不要 `set:html` 任意 HTML。
- `commentsSnippet`:旧的原样嵌入代码,仅在没有 `comments.giscus` 时作为兜底;独立页面默认不渲染评论区。
- `logo` / `avatar`:站点级图片路径(通常是 `/media/...`),换主题不会丢。是否显示由各主题自己的 `configSchema` 选项决定(如 `showLogo`、`showAvatar`)。
- `nav`:站长显式维护的顶部导航菜单——出现哪些项、顺序如何、叫什么名字,包括「首页」「RSS」是否显示,都由这个数组决定。存在时,它是导航的唯一依据;主题不得在此之外自行拼接分类或页面。**缺省时**,主题回退到隐式导航(首页 + `inNav` 分类 + 全部页面);RSS 默认放在页脚,只有菜单里显式加入才会出现在顶栏。每项的 `type` 为 `home` / `rss` / `category` / `page` / `link` 之一;`category`/`page` 需要对应的 `slug`,`link` 需要 `url` 与 `label`;其余类型的 `label` 均可选,缺省时由主题按 `site.language` 给出默认文案(如「首页」/ “Home”)。
- `footer`:站长显式维护的页脚。**缺省时**主题显示版权(默认用站点名,不用 GitHub 登录名)、GitPress 署名、当前主题开源页(若 `theme.json` 有 `homepage`)、RSS。保存过之后,列表即真相:不在列表里的槽就是关了。系统槽 `copyright` / `gitpress` / `theme` / `rss` 只增不删(新槽必须 `defaultEnabled: false`);站长自定义永远只有 `page` / `link` / `text`。不认识的 `type`:有 `url`+`label` 当外链,只有 `label` 当纯文本,否则跳过。`{year}` 在构建时替换。`theme` 不存 URL,由当前主题的 `theme.json` 解析。关掉页脚 RSS **不影响** `/rss.xml` 与 `<head>` 里的 `rel="alternate"`。
- `beian`:中国大陆备案。`icp` 链到工信部查询页,`gongan` 为公安备案号(数字)并配盾牌图标。填了就出现在页脚**末尾**,不进可删列表;海外站点留空即可。

以上字段均为新增的可选字段,不涉及 `schemaVersion` 变更。

制作或导入主题见 [`THEME_AUTHORING.md`](THEME_AUTHORING.md)。

## 文章 frontmatter(v1)

```yaml
---
title: 你好,世界        # 必填
date: 2026-08-30T14:05:00  # ISO 8601 本地墙钟;仅日期也兼容。缺失、draft、或晚于站点时区当前墙钟视为未发布
updated: 2026-08-30T18:00:00
draft: false            # true 时不进入公开构建,永不离开私有数据仓库
tags: [随笔]
categories: [生活]
description: 摘要,用于列表与 SEO
cover: /media/2026/cover.jpg
slug: hello-world       # 缺省时由文件名推导
redirectFrom: [old-slug] # 旧地址,主题生成静态 301 跳转
---
```

未知的 frontmatter 键会原样传递给主题。

## 主题包结构(engine = astro)

```
<theme>/
├── theme.json            # 清单(见 schemas/theme.schema.json)
├── package.json          # 普通 Astro 项目,构建命令为 astro build
├── astro.config.mjs
└── src/...
```

构建时,Action 会把数据仓库文件复制进主题项目(路径常量见 `THEME_MOUNT_POINTS`):

| 数据仓库 | 主题内挂载点 |
| --- | --- |
| `gitpress.json` | `gitpress.config.json` |
| `content/` | `user-content/` |
| `media/` | `public/media/` |

主题从 `gitpress.config.json` 读取站点信息与自身 `config`,用 Astro content collections 从 `user-content/` 读取文章。

`theme.json` 的 `configSchema` 就是后台「外观」页上的主题选项表单:boolean 渲染为开关,`format: "color"` 渲染为取色器,带 `enum` 的字符串渲染为下拉框。站长级图片(`site.logo` / `site.avatar`)不要放进 `theme.config`,否则换主题会丢。

制作、导入主题的完整约定见 [`THEME_AUTHORING.md`](THEME_AUTHORING.md)。

## JSON Schemas

- [`schemas/gitpress.schema.json`](schemas/gitpress.schema.json) — 站点配置
- [`schemas/theme.schema.json`](schemas/theme.schema.json) — 主题清单
