# GitPress.net

Git 原生的博客平台:内容与编译产物存放在用户自己的 GitHub 仓库中,GitPress.net 只做控制面(登录、WordPress 风格后台、GitHub API 编排),构建全部由 GitHub Actions 完成,服务器接近零负载。

## 架构总览

```
用户浏览器 ── GitPress.net (Next.js on Vercel, 闭源)
                 │  GitHub App API(提交 Markdown / 图片 / 配置)
                 ▼
         数据仓库(私有)── push 触发 ──▶ GitHub Actions(gitpress build-action)
         content/ media/ gitpress.json          │ Astro 构建,排除草稿
                                                ▼
                                        网站仓库(公开,编译产物)
                                                │
                                                ▼
                                    GitHub Pages / Vercel 托管
```

- **数据仓库默认私有**:Markdown 文章(含草稿)、图片、`gitpress.json` 站点配置。草稿永远不出私有仓库。
- **网站仓库默认公开**:只有编译后的已发布页面,免费版 GitHub Pages 亦可用。
- **换主题不动内容**:主题与版本锁定在 `gitpress.json`,重新构建即可换肤。

## 目录结构

| 目录 | 开源性 | 说明 |
| --- | --- | --- |
| `apps/web` | 闭源 | GitPress.net 平台(官网 + WordPress 风格后台) |
| `packages/spec` | 开源 | v1 规范:`gitpress.json` / `theme.json` JSON Schema、内容与 frontmatter 约定、TS 类型 |
| `packages/build-action` | 开源 | GitHub Action:读配置 → 装主题 → Astro 构建 → 推送产物到网站仓库 |
| `themes/*` | 开源 | 内置 Astro 主题(classic / minimal / ink / quill) |
| `templates/data-repo` | 开源 | 数据仓库模板(目录结构 + workflow + 示例文章) |
| `docs/` | — | 部署与接入文档 |

## 快速开始(开发)

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # 填入各项凭据
pnpm dev                                        # 启动 GitPress.net 平台
```

本地预览一个主题(使用模板里的示例内容):

```bash
node packages/build-action/scripts/prepare-local.mjs themes/classic templates/data-repo
pnpm --filter @gitpress/theme-classic dev
```

## 兼容性承诺

- 所有配置文件带 `schemaVersion`;规范只做加法,旧字段只废弃、不删除。
- 站点锁定主题版本与构建 Action 大版本(`@v1`),平台升级永不自动修改用户仓库。
- 破坏性变更只会出现在新的大版本标签(`@v2`),老站点永远能构建。

详见 [`packages/spec`](packages/spec) 与 [`docs/`](docs)。
