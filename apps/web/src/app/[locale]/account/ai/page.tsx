import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { AiSettingsForm } from "@/components/AiSettingsForm";
import { getAiConfig } from "@/lib/ai";
import { requireUser } from "@/lib/sites";

export async function generateMetadata() {
  const t = await getTranslations("aiPage");
  return { title: t("title") };
}

export default async function AiSettingsPage() {
  const user = await requireUser();
  const config = await getAiConfig(user.id);
  const t = await getTranslations("aiPage");

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4">
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
            {t("back")}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t("leadBefore")}{" "}
          <Link href="/help/ai-writing" className="text-wp-accent hover:underline">
            {t("leadLink")}
          </Link>
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
