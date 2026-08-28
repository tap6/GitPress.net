import { SiteAdminShell } from "@/components/SiteAdminShell";
import { getInstallationPermissionGap } from "@/lib/github";
import { requireSite } from "@/lib/sites";

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

  return (
    <SiteAdminShell
      siteId={site.id}
      siteName={site.name}
      siteUrl={site.url}
      dataRepo={site.dataRepo}
      userName={user.name ?? "博主"}
      permissionGap={permissionGap}
    >
      {children}
    </SiteAdminShell>
  );
}
