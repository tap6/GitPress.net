import { OpsShell } from "@/components/OpsShell";
import { requireOps } from "@/lib/ops";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("ops");
  return { title: t("title") };
}
export const dynamic = "force-dynamic";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOps();
  const t = await getTranslations();
  return <OpsShell userName={user.name ?? user.email ?? t("opsFallback")}>{children}</OpsShell>;
}
