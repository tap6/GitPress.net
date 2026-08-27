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
