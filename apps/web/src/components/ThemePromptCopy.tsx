"use client";

import { useState } from "react";
import { THEME_AUTHORING_PROMPT } from "@/lib/themePrompt";

export function ThemePromptCopy() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(THEME_AUTHORING_PROMPT);
    } catch {
      const area = document.createElement("textarea");
      area.value = THEME_AUTHORING_PROMPT;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-neutral-800">第一条消息(整段复制给 AI)</p>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          {copied ? "已复制" : "复制提示词"}
        </button>
      </div>
      <pre className="mt-3 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100">
        {THEME_AUTHORING_PROMPT}
      </pre>
    </div>
  );
}
