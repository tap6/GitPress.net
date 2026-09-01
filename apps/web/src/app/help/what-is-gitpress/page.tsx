import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "这是什么项目？",
  description:
    "WordPress 博客因忘续服务器丢光数据之后，才有了 GitPress。正文在你自己的 GitHub 仓库，后台只是遥控器。",
};

const PLATFORM_REPO = "https://github.com/tap6/GitPress.net";
const GITPRESS_REPO = "https://github.com/tap6/gitpress";
const BUILD_ACTION_REPO = "https://github.com/tap6/build-action";

const BODY = "text-sm leading-relaxed text-neutral-700";
const BODY_MUTED = "text-sm leading-relaxed text-neutral-500";

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function Mark({ children }: { children: ReactNode }) {
  return (
    <mark className="box-decoration-clone rounded bg-gp-brand/12 px-1 py-px font-medium text-neutral-900">
      {children}
    </mark>
  );
}

function RepoCard({
  featured,
  label,
  name,
  body,
  href,
}: {
  featured?: boolean;
  label: string;
  name: string;
  body: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className={`group block rounded-lg border p-5 transition-colors ${
        featured
          ? "border-gp-brand/35 bg-white shadow-sm ring-1 ring-gp-brand/10"
          : "border-neutral-200 bg-white hover:border-neutral-300"
      }`}
      target="_blank"
      rel="noreferrer"
    >
      <p className={`text-xs font-medium ${featured ? "text-gp-brand" : "text-neutral-400"}`}>{label}</p>
      <p className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-neutral-900">
        <GitHubMark className="h-4 w-4 shrink-0 text-neutral-500" />
        {name}
      </p>
      <p className={`mt-2 ${BODY}`}>{body}</p>
      <p className="mt-3 text-xs font-medium text-neutral-500 group-hover:text-neutral-800">在 GitHub 打开 →</p>
    </a>
  );
}

export default function WhatIsGitPressHelpPage() {
  return (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">帮助</p>
      <p className="mt-2">
        <Link href="/help" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← 全部帮助
        </Link>
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">这是什么项目？</h1>
      <p className={`mt-4 ${BODY_MUTED}`}>
        先讲作者为什么做这个；再讲后台、主题约定和构建各自管什么。
      </p>

      <section className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-6 sm:px-6">
        <h2 className="text-base font-semibold text-neutral-900">这个项目为什么会出现</h2>
        <div className={`mt-4 space-y-3 ${BODY}`}>
          <p>
            我之前有一个 <strong className="font-semibold text-neutral-900">WordPress</strong> 个人博客，大概用了五六年。
            <Mark>每年都要重新买服务器</Mark>（新购服务器在价格上会便宜很多）、做迁移、再给域名做解析。
            累，而且会一再发生。
          </p>
          <p>
            有一次忘了续服务器、也没做迁移。
            <Mark>几年博客的数据全部遗失。</Mark>
            如果没有更一劳永逸的办法，这种又累、又可能再来一次的事还会发生。于是我去找相关项目。
          </p>
          <p>
            <strong className="font-semibold text-neutral-900">Hugo</strong> 以及一系列 <strong className="font-semibold text-neutral-900">SSG</strong>（静态站点生成器）都能编出网站，但
            <Mark>使用上的心智成本和操作成本都不低。</Mark>
          </p>
          <p>
            后来遇到 <strong className="font-semibold text-neutral-900">Gridea</strong>。数据保存在电脑上，必须坐在电脑前写，<Mark>不能随时随地写</Mark>，就弃用了。它后来出了网页版，但又收费、又有限制，还不如本地版。本质没变：
            <Mark>文章数据依然不够安全。</Mark>
          </p>
          <p>
            为了解决这个史诗级大难题——而现在市面上的开源工具已经够撑起这样一套——我开始做架构。
            <Mark>用了单博客双仓库等设计。</Mark>
            还有很多架构上的设计此处不展开细说，如果有需要可以把源码仓库 fork 下来让 AI 帮助你了解。
          </p>
          <p className="text-neutral-600">
            首版用 <strong className="font-semibold text-neutral-900">Fable 5</strong> 写。仅第一次让 AI 跑 plan 就花了 <Mark>200 元</Mark>。有一说一，<strong className="font-semibold text-neutral-900">Fable 5</strong> 是真贵。后面又多轮加功能、改问题，才有现在这版。
          </p>
        </div>
      </section>

      <p className={`mt-8 ${BODY}`}>
        所以现在你每天用的是后台。真正撑起站点的，是你 GitHub 上的两个仓库，再加上源码公开的后台、以及 MIT 开源的主题和构建工具。后台只是遥控器。
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">你在乎什么</h2>
        <ul className={`mt-3 list-disc space-y-1.5 pl-5 ${BODY}`}>
          <li>文章会不会被平台扣住，哪天想走还得「申请导出」。</li>
          <li>读者打开的是不是 gitpress.net 上的页面，站点活不活绑在我们服务器上。</li>
          <li>这家网站关了，你还能不能用同一份稿子自己编、自己挂。</li>
        </ul>
        <p className={`mt-3 ${BODY_MUTED}`}>下面三块分别对应这三件事。不用先去读仓库 README。</p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">三块分别管什么</h2>
        <div className="mt-4 space-y-3">
          <RepoCard
            featured
            label="主仓库 · 你每天点的网站"
            name="tap6/GitPress.net"
            body="WordPress 式后台：登录、建仓、写稿、点保存。我们替你调 GitHub API，Postgres 里没有正文。源码公开（PolyForm Shield），可自用。关停了，你少的是这个后台，不是文章。"
            href={PLATFORM_REPO}
          />
          <RepoCard
            label="博客长什么样"
            name="tap6/gitpress"
            body="内置主题、文章 Markdown 怎么写、gitpress.json 是什么意思。换主题或自己做主题，都认这份约定。数据仓模板也在这里。"
            href={GITPRESS_REPO}
          />
          <RepoCard
            label="点保存之后谁在干活"
            name="tap6/build-action"
            body="从你的私有数据仓读内容，编成静态站，推进公开网站仓。跑在 GitHub 上，不跑在 gitpress.net 的机器上。"
            href={BUILD_ACTION_REPO}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">关停了怎么办</h2>
        <p className={`mt-2 ${BODY}`}>
          不是「导出再搬家」。正文、图片、草稿从来没进我们的库，本来就在你的私有数据仓；读者看到的 HTML 在你的公开网站仓。用同一份
          gitpress 主题和 build-action，在 GitHub 上继续编即可。平台没了，少的是遥控器，不是稿子。
        </p>
        <p className={`mt-3 ${BODY}`}>
          控制面具体留了什么、没留什么，见{" "}
          <Link href="/privacy" className="text-neutral-900 underline hover:text-neutral-700">
            隐私
          </Link>
          。想自己做皮肤，见{" "}
          <Link href="/help/make-theme" className="text-neutral-900 underline hover:text-neutral-700">
            用 AI 做主题
          </Link>
          。
        </p>
      </section>
    </>
  );
}
