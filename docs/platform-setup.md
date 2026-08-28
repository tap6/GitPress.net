# GitPress.net 平台上线指南

从零把平台(`apps/web`)部署到 Vercel 的完整步骤。

## 1. 数据库(Postgres)

任意 Postgres 均可(推荐 [Neon](https://neon.tech) 或 [Supabase](https://supabase.com) 免费档)。
拿到连接串后:

```bash
cd apps/web
cp .env.example .env.local        # 填入 DATABASE_URL
pnpm db:push                      # 用 drizzle 同步表结构
```

数据库只存元数据(用户、站点、GitHub 安装映射),用户内容永远在他们自己的仓库里。

## 2. 开源仓库拆分

本 monorepo 的开源部分需要发布为两个公开仓库(名字对应 `.env` 中的配置):

| 公开仓库 | 内容 | 对应环境变量 |
| --- | --- | --- |
| `tap6/gitpress` | `packages/spec` + `themes/*` + `templates/`(打 `v1` 标签) | `GITPRESS_THEMES_REPO` |
| `tap6/build-action` | `packages/build-action` 的内容(根目录含 `action.yml`,打 `v1` 标签) | `GITPRESS_BUILD_ACTION_REPO` |

> 说明:`gitpress-net` 目前只是 GitHub App 的 slug,并非真实存在的 GitHub 账号/组织,
> 所以这两个开源仓库暂时建在你的个人账号 `tap6` 下。以后如果注册了 `gitpress-net`
> 组织,把仓库转移过去(Settings → Transfer ownership)并同步更新这里的环境变量即可,
> 不影响已上线站点(它们锁定的是 `owner/repo@v1`,转移仓库后 GitHub 会自动重定向旧地址)。

> 重要:两个仓库都要打 `v1` git 标签。用户站点全部锁定在 `@v1`,以后升级时:
> 兼容性修复直接移动 `v1` 标签;破坏性变更发布 `v2` 标签,老站点不受影响。

## 3. 注册 GitHub App

GitHub → Settings → Developer settings → **GitHub Apps** → New GitHub App:

- **App name / slug**:如 `gitpress-net`(slug 填入 `GITHUB_APP_SLUG`)
- **Callback URL** 与 **Setup URL**:`https://你的域名/api/github/setup`
- 勾选 **Request user authorization (OAuth) during installation**(建私有仓库需要)
- 勾选 **Redirect on update**(用户在 GitHub 上批准新权限后,会回到 `/api/github/setup?setup_action=update`,平台据此提示「权限已更新」。不勾选也能批准,只是批准后会停在 GitHub 页面)
- 取消勾选 **Expire user authorization tokens**(MVP 不做刷新流程)
- Webhook:MVP 可以不启用
- **Repository permissions**:
  - Administration: Read & write(建仓、deploy key、Pages)
  - Contents: Read & write(提交文章/图片,同时也是"触发重新构建"依赖的权限——见下方说明)
  - Pages: Read & write
  - Secrets: Read & write(写入构建用的 deploy key)
  - Workflows: Read & write(提交 workflow 文件——注意这**不等于** Actions 权限,见下)
  - Metadata: Read-only
  - Actions: Read & write(可选,但建议勾选——用于在仪表盘里读取「最近构建」列表。
    注意"Workflows"权限只管写 `.github/workflows/*.yml` 文件本身,不包含调用
    Actions API 列出/触发 workflow run;这是两个独立的权限位。没有勾选时,
    "手动触发重新构建"仍会工作,因为我们改用直接提交一个空文件来触发 `on: push`,
    但仪表盘会显示"缺少 Actions 权限"提示而不是真实的构建记录。
    ⚠️ 给已安装的 App 追加权限后,已有的 installation **不会自动生效**,GitHub 只会给安装者发一封邮件,gitpress.net 的登录会话也不会弹出授权窗。用户必须到 GitHub 安装配置页点一次 Accept。平台会对比 `GET /app` 与该 installation 已授予的权限,若有缺口就在仪表盘/后台顶部显示「前往 GitHub 批准」横幅。批准后旧权限继续可用,新权限立刻生效,不必卸载重装。
- 生成 **Private key**(PEM)、记录 **App ID**、**Client ID/Secret**,填入 `.env`
  (`GITHUB_APP_PRIVATE_KEY` 中换行写成 `\n`)。

用户安装 App 时请选择 **All repositories**,这样新创建的仓库自动获得授权。

## 4. 快捷登录 OAuth 应用

按需注册,缺的会自动从登录页隐藏:

| 提供商 | 控制台 | 回调地址 |
| --- | --- | --- |
| Google | console.cloud.google.com | `https://域名/api/auth/callback/google` |
| GitHub | Settings → Developer settings → OAuth Apps | `https://域名/api/auth/callback/github` |
| Microsoft | entra.microsoft.com(App registrations) | `https://域名/api/auth/callback/microsoft-entra-id` |
| X | developer.x.com | `https://域名/api/auth/callback/twitter` |

## 5. 部署到 Vercel

1. Vercel → New Project → 导入本仓库,**Root Directory 选 `apps/web`**。
2. Framework 自动识别 Next.js;Install Command 用 `pnpm install`(在 monorepo 根执行)。
3. 把 `.env.local` 的所有变量填入 Project → Settings → Environment Variables,
   `AUTH_URL` 改为正式域名。
4. 域名 `gitpress.net` 的 DNS 按 Vercel 提示指向即可。

## 6. 本地开发

```bash
pnpm install
pnpm dev                 # http://localhost:3000

# 主题开发预览(不需要任何凭据)
node packages/build-action/scripts/prepare-local.mjs themes/classic templates/data-repo
pnpm --filter @gitpress/theme-classic dev
```
