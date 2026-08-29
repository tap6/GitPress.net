# 用户站点的部署方式

GitPress 建站后默认走 GitHub Pages。编译产物在公开的**网站仓库**里,也可以接到 Vercel、Cloudflare Pages 或任意静态托管。
用自己的域名访问时,多数人直接用一级域名(example.com);二级、多级也可以。先在后台「设置 → 访问地址」写上访客 URL(会改 `site.url` / `site.basePath` 并重建);
域名挂在哪家,就在哪家控制台添加。设置页和帮助页可按托管切换步骤。说明见 [/help/custom-domain](https://gitpress.net/help/custom-domain)。

## 默认:GitHub Pages(自动)

建站向导完成后:

1. 数据仓库的每次 push 触发 `gitpress-build.yml` workflow;
2. build action 用锁定的主题构建,产物推送到网站仓库 `main` 分支;
3. Pages 从 `main` 分支根目录发布,地址为
   `https://<用户名>.github.io/<站点标识>/`。

`gitpress.json` 里的 `site.url` 与 `site.basePath` 已由 GitPress 自动写好。

> 注意:GitHub 免费账号的 Pages 只支持公开仓库,这正是「数据私有 + 产物公开」
> 双仓库设计的原因 —— 草稿和未发布内容只存在于私有数据仓库,永远不会进入公开产物。

若继续用 Pages 并换成自己的域名:在访问地址选「GitHub Pages」,按步骤里的表格写 DNS。
build action 会保留网站仓库里已有的 `CNAME` 文件。

## 可选:Vercel / Cloudflare Pages

网站仓库是纯静态文件:

1. 在 Vercel 或 Cloudflare Pages 导入网站仓库(`<站点标识>`,不是 `-data` 仓库);
2. 不要再跑框架构建(Vercel: Framework Other, Build 留空, Output `.`);
3. 在那家控制台添加域名,并在 GitPress 选对应托管、填同一访客地址(不要选 GitHub Pages)。选 Vercel / Cloudflare 保存时会取消 Pages 上已有的域名登记。

不要把同一个 hostname 同时指到 Pages 和另一家。

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
