import { SiteAdminShell } from "@/components/SiteAdminShell";
import { RepoMissingBanner } from "@/components/RepoMissingBanner";
import {
  getInstallationOctokit,
  getInstallationPermissionGap,
  probeSiteRepos,
  reposNeedAttention,
  type RepoPresence,
} from "@/lib/github";
import { noIndexMetadata } from "@/lib/seo";
import { requireSite } from "@/lib/sites";
import { getTranslations } from "next-intl/server";

export function generateMetadata() {
  return noIndexMetadata();
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, user, installation } = await requireSite(siteId);
  const t = await getTranslations();
  let permissionGap = null;
  let repoPresence: { data: RepoPresence; site: RepoPresence } = { data: "error", site: "error" };
  try {
    const octokit = await getInstallationOctokit(installation.installationId);
    [permissionGap, repoPresence] = await Promise.all([
      getInstallationPermissionGap(installation.installationId),
      probeSiteRepos(octokit, site.dataRepo, site.siteRepo),
    ]);
  } catch (error) {
    console.error("admin layout github", error);
  }

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
      {reposNeedAttention(repoPresence) ? (
        <RepoMissingBanner
          siteId={site.id}
          siteName={site.name}
          slug={site.slug}
          dataRepo={site.dataRepo}
          siteRepo={site.siteRepo}
          dataStatus={repoPresence.data}
          siteStatus={repoPresence.site}
          installUrl={`https://github.com/settings/installations/${installation.installationId}`}
        />
      ) : null}
      {children}
    </SiteAdminShell>
  );
}
