export function AiWritingEn() {
  return (
    <>
      <p className="mt-4 leading-relaxed text-neutral-500">
        GitPress doesn’t host models. Fill in your own OpenAI-compatible endpoint on the account, then the
        editor can generate drafts and summaries.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Configure first</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Open Settings → AI writing on any site. Fill Base URL, model name, and API key. This config
          follows the account and applies to every site under it. The key lives on the GitPress control
          plane, stored encrypted.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">AI draft</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
          <li>In the visual editor toolbar, tap “AI draft” (not available in source mode).</li>
          <li>Write a topic or a few points, optionally tone and length, then preview.</li>
          <li>
            “Insert at cursor” or “Replace all.” It’s only in the editor until you save to the repo.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">AI summary</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Beside “Summary” in the post sidebar you can generate a sentence or two from the current body
          into frontmatter <code className="rounded bg-neutral-100 px-1">description</code>. That also hits
          the repo only after you save.
        </p>
      </section>
    </>
  );
}
