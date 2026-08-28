"use client";

import { useActionState } from "react";
import { clearAiSettingsAction, saveAiSettingsAction, type SaveAiSettingsState } from "@/lib/actions";

interface Props {
  hasExisting: boolean;
  initial: { baseUrl: string; model: string };
}

export function AiSettingsForm({ hasExisting, initial }: Props) {
  const [state, formAction] = useActionState<SaveAiSettingsState, FormData>(
    saveAiSettingsAction,
    {},
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4 rounded border border-neutral-200 bg-white p-5 text-sm shadow-sm">
        <label className="block">
          <span className="font-medium">Base URL</span>
          <input
            name="baseUrl"
            required
            defaultValue={initial.baseUrl}
            placeholder="https://api.openai.com/v1"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
          />
          <span className="mt-1 block text-xs text-neutral-400">
            任意 OpenAI 兼容接口:OpenAI、DeepSeek、月之暗面、Qwen、OpenRouter 等均可。
          </span>
        </label>
        <label className="block">
          <span className="font-medium">模型名称</span>
          <input
            name="model"
            required
            defaultValue={initial.model}
            placeholder="gpt-4o-mini"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-wp-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="font-medium">API Key</span>
          <input
            name="apiKey"
            type="password"
            autoComplete="off"
            placeholder={hasExisting ? "已配置,留空则保持不变" : "sk-..."}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-wp-accent focus:outline-none"
          />
          <span className="mt-1 block text-xs text-neutral-400">
            加密后存储,任何人(包括我们)都无法在数据库里看到明文。
          </span>
        </label>

        {state.error && <p className="rounded bg-red-50 p-3 text-red-600">{state.error}</p>}
        {state.saved && <p className="rounded bg-emerald-50 p-3 text-emerald-700">已保存。</p>}

        <button
          type="submit"
          className="rounded bg-wp-accent px-4 py-2 font-medium text-white hover:bg-wp-accent-dark"
        >
          保存
        </button>
      </form>

      {hasExisting && (
        <form action={clearAiSettingsAction}>
          <button type="submit" className="text-xs text-neutral-400 hover:text-red-600">
            清除已保存的 AI 配置
          </button>
        </form>
      )}
    </div>
  );
}
