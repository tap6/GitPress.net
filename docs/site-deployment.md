# 用户站点的部署方式

GitPress 建站后默认走 GitHub Pages,也可以随时切到 Vercel 或绑定自定义域名。
所有方案都基于同一个公开的**网站仓库**(编译产物),互不冲突。

## 默认:GitHub Pages(自动)

建站向导完成后:

1. 数据仓库的每次 push 触发 `gitpress-build.yml` workflow;
2. build action 用锁定的主题构建,产物推送到网站仓库 `main` 分支;
3. Pages 从 `main` 分支根目录发布,地址为
   `https://<用户名>.github.io/<站点标识>/`。

`gitpress.json` 里的 `site.url` 与 `site.basePath` 已由 GitPress 自动写好。

> 注意:GitHub 免费账号的 Pages 只支持公开仓库,这正是「数据私有 + 产物公开」
> 双仓库设计的原因 —— 草稿和未发布内容只存在于私有数据仓库,永远不会进入公开产物。

## 可选:Vercel

网站仓库是纯静态文件,导入即用:

1. Vercel → New Project → 导入网站仓库(`<站点标识>`,不是 `-data` 仓库);
2. Framework Preset 选 **Other**,Build Command 留空,Output Directory 填 `.`;
3. 部署完成后,把数据仓库 `gitpress.json` 中的
   `site.url` 改为 Vercel 域名、`site.basePath` 改为 `"/"`,提交后自动重建。

此后每次 GitPress 构建推送到网站仓库,Vercel 都会自动同步部署。

## 可选:自定义域名

### 用在 GitHub Pages 上

1. 网站仓库 → Settings → Pages → Custom domain 填入域名(GitHub 会在仓库中生成
   CNAME 文件);DNS 按 GitHub 文档做 CNAME/A 记录;
2. 把 `gitpress.json` 的 `site.url` 改为 `https://你的域名`、`site.basePath` 改为 `"/"`。

build action 在每次发布时会保留网站仓库中已有的 CNAME 文件,自定义域名不会因重建而失效。

### 用在 Vercel 上(推荐)

Vercel → Project → Settings → Domains 添加域名,DNS 指向 Vercel;
同样更新 `gitpress.json` 的 `site.url` 与 `site.basePath`。

## 端到端验证清单

上线一个真实站点后,依次确认:

- [ ] 数据仓库为私有、网站仓库为公开;
- [ ] 数据仓库 Actions 页面中 `GitPress Build` 运行成功;
- [ ] 网站仓库出现构建产物(含 `.nojekyll`);
- [ ] Pages 地址可访问,文章、about 页、标签页、RSS(`/rss.xml`)正常;
- [ ] 在后台保存一篇 `draft` 草稿,确认公开站点与网站仓库中均不出现;
- [ ] 在后台「外观」切换主题,确认重建后文章内容原样保留。

本仓库开发环境已验证:三个内置主题以模板内容成功构建、草稿被公开构建排除、
Actions secret 加密(sealed box)与部署密钥生成逻辑通过本地自检。
涉及真实 GitHub 账号的链路(建仓、Pages 启用、Actions 运行)需在配置好
GitHub App 凭据后按上面清单走一遍。
