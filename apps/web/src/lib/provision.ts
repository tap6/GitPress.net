import type { Octokit } from "octokit";
import { defaultAboutTitle, languageBase } from "./locale";
import {
  addDeployKey,
  createRepository,
  dispatchBuild,
  enablePages,
  generateDeployKeyPair,
  getInstallationOctokit,
  putActionsSecret,
  putFile,
  removeDeployKeys,
} from "./github";

export interface ProvisionInput {
  installation: {
    installationId: number;
    accountLogin: string;
    accountType: string;
    userToken?: string | null;
  };
  site: {
    name: string;
    slug: string;
    description: string;
    language: string;
    author: string;
    themeName: string;
  };
}

export interface ProvisionResult {
  dataRepo: string;
  siteRepo: string;
  url: string | null;
  basePath: string;
  pagesEnabled: boolean;
}

const BUILD_ACTION_REPO = () => process.env.GITPRESS_BUILD_ACTION_REPO ?? "tap6/build-action";
const THEMES_REPO = () => process.env.GITPRESS_THEMES_REPO ?? "tap6/gitpress";

/**
 * Create the two repositories for a new site and initialize them:
 *   - <slug>-data (private): content + config + build workflow
 *   - <slug> (public): receives compiled output, serves GitHub Pages
 */
export async function provisionSite(input: ProvisionInput): Promise<ProvisionResult> {
  const { installation, site } = input;
  const octokit = await getInstallationOctokit(installation.installationId);
  const owner = installation.accountLogin;

  const dataRepoName = `${site.slug}-data`;
  const siteRepoName = site.slug;
  const dataRef = { owner, repo: dataRepoName };
  const siteRef = { owner, repo: siteRepoName };

  // 1. Create both repositories.
  await createRepository({
    octokit,
    accountLogin: owner,
    accountType: installation.accountType,
    userToken: installation.userToken,
    name: dataRepoName,
    description: `Content for "${site.name}" (GitPress data repository)`,
    isPrivate: true,
    autoInit: false,
  });
  await createRepository({
    octokit,
    accountLogin: owner,
    accountType: installation.accountType,
    userToken: installation.userToken,
    name: siteRepoName,
    description: `Compiled site for "${site.name}" (published by GitPress)`,
    isPrivate: false,
    autoInit: true,
  });

  // 2. Deploy key: public half on the site repo, private half as a secret in the data repo.
  const keys = generateDeployKeyPair();
  await addDeployKey(octokit, siteRef, keys.publicOpenSsh);
  await putActionsSecret(octokit, dataRef, "GITPRESS_DEPLOY_KEY", keys.privatePem);

  // 3. Compute the public URL (default: GitHub Pages project site).
  const pagesUrl = `https://${owner.toLowerCase()}.github.io/${siteRepoName}/`;
  const basePath = `/${siteRepoName}/`;

  // 4. Push the initial content. The workflow file goes last so the first
  //    triggered build already sees the complete repository.
  const today = new Date().toISOString().slice(0, 10);
  const files: Array<{ path: string; content: string }> = [
    {
      path: "gitpress.json",
      content: `${JSON.stringify(
        {
          schemaVersion: 1,
          site: {
            title: site.name,
            description: site.description,
            language: site.language,
            url: pagesUrl,
            basePath,
            author: site.author,
          },
          theme: { name: site.themeName, source: "builtin", ref: "v1", config: {} },
          build: { includeDrafts: false, output: "dist" },
        },
        null,
        2,
      )}\n`,
    },
    {
      path: "content/posts/hello-world.md",
      content: helloPost(today, site.language),
    },
    {
      path: "content/pages/about.md",
      content: aboutPage(site.language),
    },
    {
      path: "media/.gitkeep",
      content: "",
    },
    {
      path: "README.md",
      content: dataReadme(site.name, `${owner}/${siteRepoName}`),
    },
    {
      path: ".github/workflows/gitpress-build.yml",
      content: buildWorkflow(`${owner}/${siteRepoName}`),
    },
  ];
  for (const file of files) {
    await putFile(octokit, dataRef, file.path, { utf8: file.content }, `Initialize ${file.path}`);
  }

  // 5. Enable Pages on the site repo. No need to also call dispatchBuild
  //    here — the workflow file committed above already triggered the
  //    first build via its own `on: push`.
  const enabledUrl = await enablePages(octokit, siteRef);

  return {
    dataRepo: `${owner}/${dataRepoName}`,
    siteRepo: `${owner}/${siteRepoName}`,
    url: enabledUrl ?? pagesUrl,
    basePath,
    pagesEnabled: enabledUrl != null,
  };
}

export async function triggerRebuild(installationId: number, dataRepo: string): Promise<void> {
  const octokit = await getInstallationOctokit(installationId);
  const [owner, repo] = dataRepo.split("/");
  await dispatchBuild(octokit, { owner, repo });
}

/**
 * Regenerate the SSH deploy key used to publish to the site repository, then
 * trigger a rebuild. Fixes sites provisioned before the OpenSSH key-format
 * fix (Node's PKCS8 export is rejected by `ssh` for ed25519 keys, so builds
 * silently failed at the publish step even though Pages looked "enabled").
 */
export async function rotateDeployKey(
  installationId: number,
  dataRepo: string,
  siteRepo: string,
): Promise<void> {
  const octokit = await getInstallationOctokit(installationId);
  const [dOwner, dRepo] = dataRepo.split("/");
  const [sOwner, sRepo] = siteRepo.split("/");
  const dataRef = { owner: dOwner, repo: dRepo };
  const siteRef = { owner: sOwner, repo: sRepo };

  const keys = generateDeployKeyPair();
  await removeDeployKeys(octokit, siteRef);
  await addDeployKey(octokit, siteRef, keys.publicOpenSsh);
  await putActionsSecret(octokit, dataRef, "GITPRESS_DEPLOY_KEY", keys.privatePem);
  await dispatchBuild(octokit, dataRef);
}

export function repoOctokit(installationId: number): Promise<Octokit> {
  return getInstallationOctokit(installationId);
}

// ---------------------------------------------------------------------------
// Templates (kept in sync with templates/data-repo — inlined so they are
// available at runtime in the serverless bundle)
// ---------------------------------------------------------------------------

function buildWorkflow(siteRepo: string): string {
  return `# GitPress build pipeline — intentionally thin.
# All build logic lives in the versioned action so this file rarely (if ever)
# needs to change. Breaking changes only ship under a new major tag (@v2).
name: GitPress Build

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: gitpress-build
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Build site and publish to the site repository
        uses: ${BUILD_ACTION_REPO()}@v1
        with:
          site-repo: ${siteRepo}
          themes-repo: ${THEMES_REPO()}
          deploy-key: \${{ secrets.GITPRESS_DEPLOY_KEY }}
`;
}

function helloPost(today: string, language: string): string {
  const base = languageBase(language);
  if (base === "zh") {
    return `---
title: "你好,世界"
date: "${today}"
tags: [hello]
description: "我在 GitPress 上的第一篇文章。"
---

欢迎来到你的新博客。这篇文章存在私有**数据仓库**的 \`content/posts/\` 里——可以在 GitPress 后台改,也可以用任何编辑器改完提交,站点会自动重建。

几点说明:

- 在 frontmatter 里写 \`draft: true\`,文章就不会出现在公开站点。草稿永远不会离开这个私有仓库。
- 图片放进 \`media/\` 文件夹,用 \`![说明](/media/your-image.jpg)\` 引用。
- 主题和选项在 \`gitpress.json\`。换主题不会动你的文章。

开始写作吧。
`;
  }
  if (base === "ja") {
    return `---
title: "Hello, world"
date: "${today}"
tags: [hello]
description: "GitPress での最初の記事です。"
---

新しいブログへようこそ。この記事は非公開の**データリポジトリ**の \`content/posts/\` にあります。GitPress の管理画面でも、好きなエディタでも編集できます。コミットするとサイトが自動で再ビルドされます。

- frontmatter に \`draft: true\` を書くと公開サイトに出ません。下書きはこの非公開リポジトリから出ません。
- 画像は \`media/\` に置き、\`![alt](/media/your-image.jpg)\` で参照します。
- テーマは \`gitpress.json\` にあります。テーマを変えても本文は消えません。
`;
  }
  return `---
title: "Hello, world"
date: "${today}"
tags: [hello]
description: "My first post on GitPress."
---

Welcome to your new blog! This post lives in \`content/posts/\` of your **private
data repository** — edit it from the GitPress dashboard or with any editor you
like, commit, and your site rebuilds automatically.

A few things worth knowing:

- Set \`draft: true\` in the frontmatter and a post stays out of your public
  site. Drafts never leave this private repository.
- Images go into the \`media/\` folder and can be referenced as
  \`![alt](/media/your-image.jpg)\`.
- Your theme and its options live in \`gitpress.json\`. Switching themes never
  touches your writing.

Happy publishing!
`;
}

function aboutPage(language: string): string {
  const title = defaultAboutTitle(language);
  const base = languageBase(language);
  if (base === "zh") {
    return `---
title: "${title}"
---

在这里介绍你自己。本页位于 \`content/pages/about.md\`,会出现在站点导航里。导航上显示的名字也可以在后台「菜单」里单独修改。
`;
  }
  if (base === "ja") {
    return `---
title: "${title}"
---

自己紹介をここに書いてください。このページは \`content/pages/about.md\` にあり、サイトのナビゲーションに表示されます。ナビ上の名前は管理画面の「メニュー」で別に変えられます。
`;
  }
  return `---
title: "${title}"
---

Write something about yourself here. This page lives in \`content/pages/about.md\`
and shows up in your site navigation. You can also override the nav label in the
Menu editor without renaming the page.
`;
}

function dataReadme(siteName: string, siteRepo: string): string {
  return `# ${siteName} — GitPress data repository

This private repository holds the **content** of your GitPress site:

\`\`\`
gitpress.json      site + theme configuration
content/posts/     blog posts (Markdown; draft: true = private)
content/pages/     standalone pages (about, contact, ...)
media/             images and other assets
\`\`\`

Every push to \`main\` triggers the GitPress build action, which compiles your
site with the theme pinned in \`gitpress.json\` and publishes the result to your
public site repository: **${siteRepo}**.

Manage everything comfortably at [GitPress.net](https://gitpress.net), or edit
files directly — it is your repository.
`;
}
