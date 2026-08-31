import type { Metadata } from "next";
import Link from "next/link";
import { ThemePromptCopy } from "@/components/ThemePromptCopy";

export const metadata: Metadata = {
  title: "用 AI 做主题",
  description:
    "用 AI 做一份 GitPress 能导入的 Astro 主题：复制第一条提示词，让 AI 先向你提问，再生成完整主题并推到 GitHub。",
};

export default function MakeThemeHelpPage() {
  return (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">帮助</p>
      <p className="mt-2">
        <Link href="/help" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← 全部帮助
        </Link>
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">用 AI 做一份 GitPress 主题</h1>
      <p className="mt-4 leading-relaxed text-neutral-500">
        GitPress 默认你用自己的 AI（Cursor、ChatGPT、Claude 等）来写主题。先把下面整段提示词作为
        <strong>第一条消息</strong>
        发出去，AI 会反过来问你风格、布局、选项；你答完后，它会给出一份符合 spec v1 的完整 Astro
        主题。推到公开 GitHub 仓库，再到后台「外观」里导入即可。
      </p>

      <ol className="mt-10 space-y-6">
        <li className="rounded-xl border border-neutral-200 p-5 shadow-sm">
          <p className="text-sm font-semibold">1. 复制提示词，发给你的 AI</p>
          <p className="mt-1 text-sm text-neutral-500">
            不要改结构。第一条必须是这段，这样 AI 才会先提问、而不是直接瞎生成。
          </p>
        </li>
        <li className="rounded-xl border border-neutral-200 p-5 shadow-sm">
          <p className="text-sm font-semibold">2. 回答 AI 的问题</p>
          <p className="mt-1 text-sm text-neutral-500">
            风格、字体、卡片还是列表、要不要暗色、Logo/头像怎么摆、主题名叫什么。答得越具体，主题越能一次成型。
          </p>
        </li>
        <li className="rounded-xl border border-neutral-200 p-5 shadow-sm">
          <p className="text-sm font-semibold">3. 把生成的主题推到公开 GitHub 仓库</p>
          <p className="mt-1 text-sm text-neutral-500">
            可以是独立仓库，也可以放在 <code className="rounded bg-neutral-100 px-1">themes/你的主题</code>{" "}
            子目录。根目录或子目录必须有 <code className="rounded bg-neutral-100 px-1">theme.json</code>。
          </p>
        </li>
        <li className="rounded-xl border border-neutral-200 p-5 shadow-sm">
          <p className="text-sm font-semibold">4. 在 GitPress 后台导入</p>
          <p className="mt-1 text-sm text-neutral-500">
            打开站点 → 外观 →「从 GitHub 导入主题」，粘贴仓库 URL。不清楚导入会把主题装到哪？{" "}
            <Link href="/help/import-theme" className="underline hover:text-neutral-700">
              打开说明
            </Link>
            。也可以请运营把仓库上架到主题商店，站长就能在外观页一键启用。
          </p>
        </li>
      </ol>

      <div className="mt-10 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
        <ThemePromptCopy />
      </div>

      <p className="mt-8 text-sm text-neutral-500">
        完整约定（挂载路径、导航、configSchema、logo/avatar）见开源仓库里的{" "}
        <a
          href="https://github.com/tap6/gitpress/blob/main/spec/THEME_AUTHORING.md"
          className="underline hover:text-neutral-800"
          target="_blank"
          rel="noreferrer"
        >
          THEME_AUTHORING.md
        </a>
        。还不会导入？看{" "}
        <Link href="/help/import-theme" className="underline hover:text-neutral-800">
          从 GitHub 导入主题
        </Link>
        。
      </p>
    </>
  );
}
