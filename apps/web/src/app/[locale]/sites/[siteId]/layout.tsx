import { SiteAdminShell } from "@/components/SiteAdminShell";
import { getInstallationPermissionGap } from "@/lib/github";
import { requireSite } from "@/lib/sites";
import { getTranslations } from "next-intl/server";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, user, installation } = await requireSite(siteId);
  const permissionGap = await getInstallationPermissionGap(installation.installationId);
  const t = await getTranslations();

  return (
    <SiteAdminShell
      siteId={site.id}
      siteName={site.name}
      siteUrl={site.url}
      dataRepo={site.dataRepo}
      siteRepo={site.siteRepo}
      userName={user.name ?? t("authorFallback")}
      permissionGap={permissionGap}
    >
      {children}
    </SiteAdminShell>
  );
}
