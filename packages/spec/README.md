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
    "categories": [
      { "slug": "tech", "label": "技术" },
      { "slug": "notes", "label": "随笔", "inNav": false }
    ],
    "postsPerPage": 10,
    "analyticsSnippet": "<script>/* GA4 / Umami / Plausible / Clarity 等平台给的完整代码,原样插入 </head> 前 */</script>",
    "nav": [
      { "type": "home" },
      { "type": "category", "slug": "tech" },
      { "type": "page", "slug": "about", "label": "关于我" },
      { "type": "link", "url": "https://github.com/octocat", "label": "GitHub" },
      { "type": "rss" }
    ]
  }
}
```

- `categories`:站长维护的有序分类列表。主题为每个分类生成 `/categories/<slug>/` 归档页;顶部导航只包含 `inNav` 不为 `false` 的项(缺省为 `true`,现有站点菜单不变)。每篇文章从这个列表选一个主分类(写入 frontmatter 的 `categories` 数组第 0 项),与自由的 `tags` 并存、互不影响。关掉顶栏不等于删除分类。
- `postsPerPage`:首页与归档页的分页大小,缺省 10。
- `analyticsSnippet`:原始 HTML/脚本片段,缺省不注入任何统计代码。
- `nav`:站长显式维护的顶部导航菜单——出现哪些项、顺序如何、叫什么名字,包括「首页」「RSS」是否显示,都由这个数组决定。存在时,它是导航的唯一依据;主题不得在此之外自行拼接分类或页面。**缺省时**,主题回退到各自原有的隐式导航(首页 + `inNav` 分类 + 全部页面 + RSS),保证升级前的站点菜单不变。每项的 `type` 为 `home` / `rss` / `category` / `page` / `link` 之一;`category`/`page` 需要对应的 `slug`,`link` 需要 `url` 与 `label`;其余类型的 `label` 均可选,缺省时由主题给出默认文案(分类名 / 页面标题 / “Home” / “RSS”)。

以上四个字段均为新增的可选字段,不涉及 `schemaVersion` 变更。

## 文章 frontmatter(v1)

```yaml
---
title: 你好,世界        # 必填
date: 2026-08-27        # ISO 8601;缺失视为草稿
updated: 2026-08-28
draft: false            # true 时不进入公开构建,永不离开私有数据仓库
tags: [随笔]
categories: [生活]
description: 摘要,用于列表与 SEO
cover: /media/2026/cover.jpg
slug: hello-world       # 缺省时由文件名推导
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

## JSON Schemas

- [`schemas/gitpress.schema.json`](schemas/gitpress.schema.json) — 站点配置
- [`schemas/theme.schema.json`](schemas/theme.schema.json) — 主题清单
