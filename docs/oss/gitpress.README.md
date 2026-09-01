# gitpress

**GitPress 博客的主题和约定：Markdown 怎么写、站点长什么样，都认这一份。** [MIT](LICENSE) 开源。

站点锁定本仓 `@v1`。换主题或自己做主题，都从这里的 spec 走。本仓不是后台。

中文 | [English](README.en.md)

控制面（登录、写稿、建仓）在 [tap6/GitPress.net](https://github.com/tap6/GitPress.net)，源码公开，许可是 PolyForm Shield，不是闭源，也不是本仓的 MIT。编译用 [tap6/build-action](https://github.com/tap6/build-action)（同样 MIT）。

页脚里的公安备案徽章是官方网安徽章，仅供依法展示，不随 MIT 再授权。

## 目录

| 路径 | 内容 |
| --- | --- |
| [`spec/`](spec/) | v1 规范：`gitpress.json` / `theme.json` JSON Schema、frontmatter、TypeScript 类型 |
| [`spec/THEME_AUTHORING.md`](spec/THEME_AUTHORING.md) | 做主题、导入主题的约定 |
| [`themes/`](themes/) | 内置 Astro 主题：`classic`、`minimal`、`ink`、`quill` |
| [`templates/data-repo/`](templates/data-repo/) | 数据仓库起始布局与示例 |

规范正文从 [`spec/README.md`](spec/README.md) 读起，不要把那一篇当成本仓介绍。

## 相关

- 后台：[tap6/GitPress.net](https://github.com/tap6/GitPress.net)
- 构建：`uses: tap6/build-action@v1`
- 站点：[https://gitpress.net](https://gitpress.net)

## 兼容性

- 配置带 `schemaVersion` / `specVersion`。新字段只做加法；不认识的字段必须忽略，不能整站报错。
- 破坏性变更只出现在新的大版本标签（`v2`）。本仓当前是 `v1`，向后兼容。
