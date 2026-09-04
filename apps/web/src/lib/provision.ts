import type { Octokit } from "octokit";
import { defaultAboutTitle, defaultTimeZone, languageBase } from "./locale";
import {
  addDeployKey,
  commitFiles,
  createRepository,
  dispatchBuild,
  enablePages,
  generateDeployKeyPair,
  getFileText,
  getInstallationOctokit,
  GITHUB_USER_RECONNECT,
  probeRepo,
  putActionsSecret,
  removeDeployKeys,
  repoHasCommits,
  waitUntilRepoVisible,
} from "./github";
import { refreshInstallationUserToken, resolveInstallationUserToken } from "./userAccessToken";
import { buildWorkflow } from "./publishCheck";

export interface ProvisionInput {
  installation: {
    id: string;
    installationId: number;
    accountLogin: string;
    accountType: string;
    userToken?: string | null;
    refreshToken?: string | null;
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

/** Thrown when GitHub already has `{slug}` or `{slug}-data`. */
export class RepoAlreadyExistsError extends Error {
  constructor(public slug: string) {
    super("name already exists");
    this.name = "RepoAlreadyExistsError";
  }
}

/** Thrown after at least one repo was created in this attempt. Does not delete anything. */
export class ProvisionPartialError extends Error {
  constructor(
    message: string,
    public repos: string[],
  ) {
    super(message);
    this.name = "ProvisionPartialError";
  }
}

function isRepoNameTaken(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("already exists");
}

async function ensureRepository(
  options: Parameters<typeof createRepository>[0],
): Promise<"created" | "existed"> {
  try {
    await createRepository(options);
    return "created";
  } catch (error) {
    if (isRepoNameTaken(error)) return "existed";
    throw error;
  }
}

/**
 * Create the two repositories for a new site and initialize them:
 *   - <slug>-data (private): content + config + build workflow
 *   - <slug> (public): receives compiled output, serves GitHub Pages
 *
 * Safe to retry: empty leftover repos from a failed first click are filled in;
 * a data repo that already has gitpress.json + workflow is adopted without
 * overwriting posts. A non-empty data repo that is not a GitPress repo is rejected.
 */
export async function provisionSite(input: ProvisionInput): Promise<ProvisionResult> {
  const { installation, site } = input;
  const octokit = await getInstallationOctokit(installation.installationId);
  const owner = installation.accountLogin;

  const dataRepoName = `${site.slug}-data`;
  const siteRepoName = site.slug;
  const dataRef = { owner, repo: dataRepoName };
  const siteRef = { owner, repo: siteRepoName };
  const dataFull = `${owner}/${dataRepoName}`;
  const siteFull = `${owner}/${siteRepoName}`;

  const userToken =
    installation.accountType === "Organization"
      ? installation.userToken
      : await resolveInstallationUserToken(installation);
  const refreshUserToken =
    installation.accountType === "Organization"
      ? undefined
      : () => refreshInstallationUserToken(installation);

  const created: string[] = [];
  try {
    const dataPresence = await probeRepo(octokit, dataFull);
    if (dataPresence === "forbidden") throw new RepoAlreadyExistsError(site.slug);
    if (dataPresence === "ok") {
      await waitUntilRepoVisible(octokit, dataFull);
      const [existingConfig, dataHasCommits] = await Promise.all([
        getFileText(octokit, dataRef, "gitpress.json"),
        repoHasCommits(octokit, dataRef),
      ]);
      if (dataHasCommits && !existingConfig) throw new RepoAlreadyExistsError(site.slug);
    }

    const dataCreated = await ensureRepository({
      octokit,
      accountLogin: owner,
      accountType: installation.accountType,
      userToken,
      refreshUserToken,
      name: dataRepoName,
      description: `Content for "${site.name}" (GitPress data repository)`,
      isPrivate: true,
      autoInit: false,
    });
    if (dataCreated === "created") created.push(dataFull);

    const siteCreated = await ensureRepository({
      octokit,
      accountLogin: owner,
      accountType: installation.accountType,
      userToken: installation.userToken ?? userToken,
      refreshUserToken,
      name: siteRepoName,
      description: `Compiled site for "${site.name}" (published by GitPress)`,
      isPrivate: false,
      autoInit: true,
    });
    if (siteCreated === "created") created.push(siteFull);

    await Promise.all([waitUntilRepoVisible(octokit, dataFull), waitUntilRepoVisible(octokit, siteFull)]);

    const [configFile, workflowFile, dataHasCommits] = await Promise.all([
      getFileText(octokit, dataRef, "gitpress.json"),
      getFileText(octokit, dataRef, ".github/workflows/gitpress-build.yml"),
      repoHasCommits(octokit, dataRef),
    ]);
    const gitpressReady = Boolean(configFile && workflowFile);
    if (dataHasCommits && !configFile) {
      throw new RepoAlreadyExistsError(site.slug);
    }

    const pagesUrl = `https://${owner.toLowerCase()}.github.io/${siteRepoName}/`;
    const basePath = `/${siteRepoName}/`;

    if (!gitpressReady) {
      const today = new Date()
        .toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" })
        .replace(" ", "T");
      await commitFiles(
        octokit,
        dataRef,
        initialDataFiles({
          site,
          pagesUrl,
          basePath,
          siteFull,
          today,
        }),
        "Initialize GitPress data repository",
      );
    }

    const keys = generateDeployKeyPair();
    await removeDeployKeys(octokit, siteRef);
    await addDeployKey(octokit, siteRef, keys.publicOpenSsh);
    await putActionsSecret(octokit, dataRef, "GITPRESS_DEPLOY_KEY", keys.privatePem);

    const enabledUrl = await enablePages(octokit, siteRef);

    return {
      dataRepo: dataFull,
      siteRepo: siteFull,
      url: enabledUrl ?? pagesUrl,
      basePath,
      pagesEnabled: enabledUrl != null,
    };
  } catch (error) {
    if (error instanceof RepoAlreadyExistsError) throw error;
    if (error instanceof Error && error.message === GITHUB_USER_RECONNECT) throw error;
    const message = error instanceof Error ? error.message : String(error);
    if (created.length > 0) {
      throw new ProvisionPartialError(message, created);
    }
    throw error;
  }
}

function initialDataFiles(input: {
  site: ProvisionInput["site"];
  pagesUrl: string;
  basePath: string;
  siteFull: string;
  today: string;
}) {
  const { site, pagesUrl, basePath, siteFull, today } = input;
  return [
    {
      path: "gitpress.json",
      utf8: `${JSON.stringify(
        {
          schemaVersion: 1,
          site: {
            title: site.name,
            description: site.description,
            language: site.language,
            timezone: defaultTimeZone(site.language),
            url: pagesUrl,
            basePath,
            ...(site.author ? { author: site.author } : {}),
          },
          theme: { name: site.themeName, source: "builtin", ref: "v1", config: {} },
          build: { includeDrafts: false, output: "dist" },
        },
        null,
        2,
      )}\n`,
    },
    { path: "content/posts/hello-world.md", utf8: helloPost(today, site.language) },
    { path: "content/pages/about.md", utf8: aboutPage(site.language) },
    { path: "media/.gitkeep", utf8: "" },
    { path: "README.md", utf8: dataReadme(site.name, siteFull) },
    {
      path: ".github/workflows/gitpress-build.yml",
      utf8: buildWorkflow(siteFull, null),
    },
  ];
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
