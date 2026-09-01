import { Link } from "@/i18n/navigation";
import { ThemePromptCopy } from "@/components/ThemePromptCopy";

export function MakeThemeEn() {
  return (
    <>
      <p className="mt-4 leading-relaxed text-neutral-500">
        GitPress expects you to write themes with your own AI (Cursor, ChatGPT, Claude, and the like). Send
        the prompt below as the <strong>first message</strong>. The AI will ask about style, layout, and
        options; after you answer, it produces a full Astro theme that matches spec v1. Push it to a public
        GitHub repo, then import it under Appearance in the admin.
      </p>

      <ol className="mt-10 space-y-6">
        <li className="rounded-xl border border-neutral-200 p-5 shadow-sm">
          <p className="text-sm font-semibold">1. Copy the prompt and send it to your AI</p>
          <p className="mt-1 text-sm text-neutral-500">
            Don’t change the structure. The first message must be this block, so the AI asks questions
            instead of generating blindly.
          </p>
        </li>
        <li className="rounded-xl border border-neutral-200 p-5 shadow-sm">
          <p className="text-sm font-semibold">2. Answer the AI’s questions</p>
          <p className="mt-1 text-sm text-neutral-500">
            Style, type, cards vs list, dark mode, how logo/avatar sit, the theme name. The more specific
            you are, the more likely the theme lands in one pass.
          </p>
        </li>
        <li className="rounded-xl border border-neutral-200 p-5 shadow-sm">
          <p className="text-sm font-semibold">3. Push the generated theme to a public GitHub repo</p>
          <p className="mt-1 text-sm text-neutral-500">
            It can be its own repo, or live under <code className="rounded bg-neutral-100 px-1">themes/your-theme</code>.
            The root or that subdirectory must contain <code className="rounded bg-neutral-100 px-1">theme.json</code>.
          </p>
        </li>
        <li className="rounded-xl border border-neutral-200 p-5 shadow-sm">
          <p className="text-sm font-semibold">4. Import it in the GitPress admin</p>
          <p className="mt-1 text-sm text-neutral-500">
            Open the site → Appearance → “Import theme from GitHub”, paste the repo URL. Unsure where
            import actually installs the theme?{" "}
            <Link href="/help/import-theme" className="underline hover:text-neutral-700">
              Open the guide
            </Link>
            . You can also ask ops to list the repo in the theme store so site owners can enable it in one
            click on Appearance.
          </p>
        </li>
      </ol>

      <div className="mt-10 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
        <ThemePromptCopy />
      </div>

      <p className="mt-8 text-sm text-neutral-500">
        The full contract (mount paths, nav, configSchema, logo/avatar) is in{" "}
        <a
          href="https://github.com/tap6/gitpress/blob/main/spec/THEME_AUTHORING.md"
          className="underline hover:text-neutral-800"
          target="_blank"
          rel="noreferrer"
        >
          THEME_AUTHORING.md
        </a>{" "}
        in the open-source repo. Haven’t imported yet? See{" "}
        <Link href="/help/import-theme" className="underline hover:text-neutral-800">
          Import a theme from GitHub
        </Link>
        .
      </p>
    </>
  );
}
