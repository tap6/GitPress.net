# tap6/build-action

**GitPress 的编译器：把你私有仓库里的文章编成静态网站。** 不是后台。[MIT](LICENSE) 开源。

跑在你数据仓库的 GitHub Actions 里，不跑在 gitpress.net 的机器上。请钉 `@v1`，不要用 `@main`。

中文 | [English](README.en.md)

在数据仓库的 workflow 中：读 `gitpress.json` → 拉取锁定版本的主题 → 按 `site.timezone` 补上无时区日期的偏移 → Astro 构建（默认排除草稿）→ 把产物推到公开的网站仓库。

主题和约定在 [tap6/gitpress](https://github.com/tap6/gitpress)（MIT）。控制面在 [tap6/GitPress.net](https://github.com/tap6/GitPress.net)（PolyForm Shield）。

## 用法

数据仓库 `.github/workflows/` 里：

```yaml
- uses: tap6/build-action@v1
  with:
    site-repo: alice/my-blog-site          # 接收编译产物的公开仓库
    deploy-key: ${{ secrets.GITPRESS_DEPLOY_KEY }}
```

| 输入 | 说明 |
| --- | --- |
| `site-repo` | 必填,`owner/name`,编译产物推送目标 |
| `deploy-key` | 对网站仓库有写权限的 SSH deploy key(GitPress 初始化时自动配置) |
| `site-token` | `deploy-key` 的替代:有 contents 写权限的 token |
| `themes-repo` | 内置主题所在仓库,默认 `tap6/gitpress` |
| `include-drafts` | 构建包含草稿(仅用于预览,公开站点保持 false) |

## 兼容性承诺

- 本 Action 只认识 `schemaVersion: 1`;遇到更高版本会**明确拒绝**而不是猜测。
- 破坏性变更只发布在新的大版本标签(`@v2`),`@v1` 标签永远向后兼容。
- 主题来源支持 `builtin` 与 `github:<owner>/<repo>[/<subdir>]#<ref>`;`npm:` 由规范保留,后续版本支持。

## 在 GitPress.net monorepo 里改这个 Action

本文件会出现在两个地方：发布仓 `tap6/build-action` 的根目录，以及 monorepo 的 `packages/build-action/`。下面的路径只在 **[tap6/GitPress.net](https://github.com/tap6/GitPress.net)** 仓库根目录成立，不是本 Action 仓根目录的布局。

```bash
node packages/build-action/scripts/prepare-local.mjs themes/classic templates/data-repo
pnpm --filter @gitpress/theme-classic dev
```
