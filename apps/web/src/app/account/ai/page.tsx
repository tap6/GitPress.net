import Link from "next/link";
import { AiSettingsForm } from "@/components/AiSettingsForm";
import { getAiConfig } from "@/lib/ai";
import { requireUser } from "@/lib/sites";

export const metadata = { title: "AI 设置" };

export default async function AiSettingsPage() {
  const user = await requireUser();
  const config = await getAiConfig(user.id);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4">
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
            ← 我的站点
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-bold">AI 设置</h1>
        <p className="mt-2 text-sm text-neutral-500">
          配置一次,所有站点的文章编辑器都能使用「AI 生成摘要」与「AI 生成初稿」。也可以在任意站点的「设置 → 账号 · 全局设置」里改,不必回到这一页。说明见{" "}
          <Link href="/help/ai-writing" className="text-wp-accent hover:underline">
            AI 写作
          </Link>
          。
        </p>
        <div className="mt-6">
          <AiSettingsForm
            hasExisting={config !== null}
            initial={{ baseUrl: config?.baseUrl ?? "", model: config?.model ?? "" }}
          />
        </div>
      </main>
    </div>
  );
}
