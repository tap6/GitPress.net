# @gitpress/build-action

GitHub Action(composite)。在数据仓库的 workflow 中运行:读取 `gitpress.json` → 拉取锁定版本的主题 → Astro 构建(默认排除草稿)→ 把产物推送到公开的网站仓库。

## 用法(数据仓库 workflow)

```yaml
- uses: gitpress-net/build-action@v1
  with:
    site-repo: alice/my-blog-site          # 接收编译产物的公开仓库
    deploy-key: ${{ secrets.GITPRESS_DEPLOY_KEY }}
```

| 输入 | 说明 |
| --- | --- |
| `site-repo` | 必填,`owner/name`,编译产物推送目标 |
| `deploy-key` | 对网站仓库有写权限的 SSH deploy key(GitPress 初始化时自动配置) |
| `site-token` | `deploy-key` 的替代:有 contents 写权限的 token |
| `themes-repo` | 内置主题所在 monorepo,默认 `gitpress-net/gitpress` |
| `include-drafts` | 构建包含草稿(仅用于预览,公开站点保持 false) |

## 兼容性承诺

- 本 Action 只认识 `schemaVersion: 1`;遇到更高版本会**明确拒绝**而不是猜测。
- 破坏性变更只发布在新的大版本标签(`@v2`),`@v1` 标签永远向后兼容。
- 主题来源支持 `builtin` 与 `github:<owner>/<repo>[/<subdir>]#<ref>`;`npm:` 由规范保留,后续版本支持。

## 本地开发

```bash
node packages/build-action/scripts/prepare-local.mjs themes/classic templates/data-repo
pnpm --filter @gitpress/theme-classic dev
```
