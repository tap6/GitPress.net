import type { Octokit } from "octokit";
import {
  addDeployKey,
  createRepository,
  dispatchBuild,
  enablePages,
  generateDeployKeyPair,
  getInstallationOctokit,
  putActionsSecret,
  putFile,
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
      content: helloPost(today),
    },
    {
      path: "content/pages/about.md",
      content: aboutPage(),
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

  // 5. Enable Pages on the site repo and nudge the first build.
  const enabledUrl = await enablePages(octokit, siteRef);
  await dispatchBuild(octokit, dataRef);

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

function helloPost(today: string): string {
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

function aboutPage(): string {
  return `---
title: About
---

Write something about yourself here. This page lives in \`content/pages/about.md\`
and shows up in your site navigation.
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
