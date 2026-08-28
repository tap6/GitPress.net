import { OpsShell } from "@/components/OpsShell";
import { requireOps } from "@/lib/ops";

export const metadata = { title: "运营后台" };
export const dynamic = "force-dynamic";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOps();
  return <OpsShell userName={user.name ?? user.email ?? "运营"}>{children}</OpsShell>;
}
