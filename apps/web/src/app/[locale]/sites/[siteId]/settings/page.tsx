import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BrandMediaForm } from "@/components/BrandMediaForm";
import { SiteUrlForm } from "@/components/SiteUrlForm";
import { BeianForm } from "@/components/BeianForm";
import { FooterForm } from "@/components/FooterForm";
import { rotateDeployKeyAction } from "@/lib/actions";
import { DisconnectSiteForm } from "@/components/DisconnectSiteForm";
import { AiSettingsForm } from "@/components/AiSettingsForm";
import { ProgressButton } from "@/components/ProgressButton";
import { parseSiteComments } from "@/lib/comments";
import { giscusInstallUrl, probeGiscusApp } from "@/lib/commentsConnect";
import { CommentsForm } from "@/components/CommentsForm";
import { SettingsForm } from "@/components/SettingsForm";
import { SettingsPanel, SettingsWorkspace } from "@/components/SettingsWorkspace";
import { WidgetsSettingsForm } from "@/components/WidgetsSettingsForm";
import { PublishCheckSettingsForm } from "@/components/PublishCheckSettingsForm";
import { getAiConfig } from "@/lib/ai";
import { getScratchNote } from "@/lib/scratchNote";
import { listAccountPublishCheckContext, loadPublishCheck } from "@/lib/publishCheckRepo";
import { githubPagesDefaultUrl, isDefaultPagesOrigin } from "@/lib/customDomain";
import { getInstallationOctokit, getInstallationPermissionGap, getPagesSite, splitRepo } from "@/lib/github";
import {
  cachedActionsUsage,
  cachedListPages,
  cachedSiteBeian,
  cachedSiteConfig,
  cachedSiteFooter,
} from "@/lib/siteDataCache";
import { convertUploadsToWebpEnabled } from "@/lib/convertUploadWebp";
import { requireSite } from "@/lib/sites";
import { getBuiltinTheme } from "@/lib/themes";
import { resolveInstallationUserToken } from "@/lib/userAccessToken";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ domain?: string }>;
}) {
  const { siteId } = await params;
  const { domain: domainNotice } = await searchParams;
  const { site, installation, user } = await requireSite(siteId);
  const [config, permissionGap, aiConfig, pages, footer, beian, octokit, scratch, userToken] = await Promise.all([
    cachedSiteConfig(installation.installationId, site.dataRepo),
    getInstallationPermissionGap(installation.installationId),
    getAiConfig(user.id),
    cachedListPages(installation.installationId, site.dataRepo, site.language),
    cachedSiteFooter(installation.installationId, site.dataRepo),
    cachedSiteBeian(installation.installationId, site.dataRepo),
    getInstallationOctokit(installation.installationId),
    getScratchNote(site.id),
    resolveInstallationUserToken(installation),
  ]);
  const [publishCheck, accountChecks, usage] = await Promise.all([
    loadPublishCheck(octokit, site.dataRepo, site.siteRepo),
    listAccountPublishCheckContext(user.id, site.id, installation.accountLogin),
    cachedActionsUsage({
      installationId: installation.installationId,
      dataRepo: site.dataRepo,
      accountLogin: installation.accountLogin,
      accountType: installation.accountType,
      userToken,
    }),
  ]);
  const pagesSite = await getPagesSite(octokit, splitRepo(site.siteRepo));
  const comments = parseSiteComments(config?.site.comments);
  const commentsSnippet =
    typeof config?.site.commentsSnippet === "string" ? config.site.commentsSnippet : "";
  const needsDiscussionsPermission = Boolean(
    permissionGap?.missing.some((item) => item.name === "discussions"),
  );
  const [giscusAppInstalled, installUrl] = await Promise.all([
    probeGiscusApp(site.siteRepo),
    giscusInstallUrl(octokit, site.siteRepo),
  ]);
  const author = typeof config?.site.author === "string" ? config.site.author : "";
  const logo = typeof config?.site.logo === "string" ? config.site.logo : "";
  const avatar = typeof config?.site.avatar === "string" ? config.site.avatar : "";
  const themeName = String(config?.theme.name ?? site.themeName);
  const themeDisplayName = getBuiltinTheme(themeName)?.displayName ?? themeName;
  const defaultUrl = githubPagesDefaultUrl(site.siteRepo);
  const onDefaultPages = isDefaultPagesOrigin(site.url, site.siteRepo);
  const t = await getTranslations("settings");
  const tg = await getTranslations("github");
  const td = await getTranslations("disconnect");
  const notice =
    domainNotice === "url" ||
    domainNotice === "pages" ||
    domainNotice === "unpages" ||
    domainNotice === "reset"
      ? domainNotice
      : null;

  return (
    <SettingsWorkspace initialSection={notice ? "domain" : undefined}>
      <SettingsPanel id="general">
        <section className="w-full max-w-3xl rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("general")}</h2>
          <SettingsForm
            siteId={site.id}
            initial={{
              name: site.name,
              description: site.description ?? "",
              language: site.language,
              author,
              timezone: typeof config?.site.timezone === "string" ? config.site.timezone : "",
              convertUploadsToWebp: convertUploadsToWebpEnabled(config?.site),
            }}
          />
        </section>
      </SettingsPanel>

      <SettingsPanel id="comments">
        <section className="w-full max-w-3xl rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("comments")}</h2>
          <CommentsForm
            siteId={site.id}
            siteRepo={site.siteRepo}
            giscus={comments.giscus}
            enabled={comments.enabled}
            snippet={commentsSnippet}
            reviewUrl={permissionGap?.reviewUrl}
            needsDiscussionsPermission={needsDiscussionsPermission}
            giscusAppInstalled={giscusAppInstalled}
            giscusInstallUrl={installUrl}
          />
        </section>
      </SettingsPanel>

      <SettingsPanel id="brand">
        <section className="w-full max-w-3xl rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("logoAvatar")}</h2>
          <BrandMediaForm
            siteId={site.id}
            logo={logo}
            avatar={avatar}
            convertUploadsToWebp={convertUploadsToWebpEnabled(config?.site)}
          />
        </section>
      </SettingsPanel>

      <SettingsPanel id="footer">
        <section className="w-full max-w-3xl rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("footer")}</h2>
          <FooterForm
            siteId={site.id}
            siteTitle={site.name}
            themeDisplayName={themeDisplayName}
            initial={footer}
            pages={pages}
            language={site.language}
          />
        </section>
      </SettingsPanel>

      <SettingsPanel id="beian">
        <section className="w-full max-w-3xl rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("beian")}</h2>
          <BeianForm siteId={site.id} initial={beian} />
        </section>
      </SettingsPanel>

      <SettingsPanel id="account">
        <section
          id="account-ai"
          className="w-full max-w-3xl scroll-mt-16 rounded border border-neutral-200 bg-white shadow-sm"
        >
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("accountGlobal")}</h2>
          <div className="space-y-3 p-5">
            <p className="text-sm text-neutral-500">{t("accountLead")}</p>
            <h3 className="text-sm font-medium text-neutral-800">{t("account")}</h3>
            <p className="text-xs text-neutral-400">
              {t("aiLeadBefore")}{" "}
              <Link href="/help/ai-writing" className="text-wp-accent hover:underline">
                {t("aiLeadLink")}
              </Link>
            </p>
            <AiSettingsForm
              embedded
              hasExisting={aiConfig !== null}
              initial={{ baseUrl: aiConfig?.baseUrl ?? "", model: aiConfig?.model ?? "" }}
            />
          </div>
        </section>
      </SettingsPanel>

      <SettingsPanel id="domain">
        <section
          id="domain"
          className="w-full max-w-3xl scroll-mt-16 rounded border border-neutral-200 bg-white shadow-sm"
        >
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("domain")}</h2>
          <SiteUrlForm
            siteId={site.id}
            siteRepo={site.siteRepo}
            currentUrl={site.url}
            defaultUrl={defaultUrl}
            pagesCname={pagesSite?.cname ?? null}
            certificateState={pagesSite?.certificateState ?? null}
            defaultRegisterPages={Boolean(pagesSite?.cname) || onDefaultPages}
            notice={notice}
          />
        </section>
        <section className="w-full max-w-3xl rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("hosting")}</h2>
          <div className="space-y-3 p-5 text-sm leading-relaxed text-neutral-600">
            <p>
              {t("hostingLeadBefore")}{" "}
              <a
                href={`https://github.com/${site.siteRepo}`}
                target="_blank"
                rel="noreferrer"
                className="break-all text-wp-accent hover:underline"
              >
                {site.siteRepo}
              </a>
              {t("hostingLeadAfter")}
            </p>
          </div>
        </section>
      </SettingsPanel>

      <SettingsPanel id="widgets">
        <section className="w-full max-w-3xl rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("widgets")}</h2>
          <WidgetsSettingsForm siteId={site.id} scratchEnabled={scratch.enabled} />
        </section>
      </SettingsPanel>

      <SettingsPanel id="publish">
        <section className="w-full max-w-3xl rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("publish")}</h2>
          <PublishCheckSettingsForm
            siteId={site.id}
            enabled={publishCheck.enabled}
            interval={publishCheck.interval}
            dataRepoPrivate={publishCheck.dataRepoPrivate}
            accountLogin={installation.accountLogin}
            sameAccountSiteCount={accountChecks.sameAccountSiteCount}
            otherChecks={accountChecks.otherChecks}
            otherPrivateMinutes={accountChecks.otherPrivateMinutes}
            accountUsedMinutes={usage.accountMinutesThisMonth}
          />
        </section>
      </SettingsPanel>

      <SettingsPanel id="maintain">
        <section className="w-full max-w-3xl rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("troubleshoot")}</h2>
          <div className="space-y-3 p-5 text-sm leading-relaxed text-neutral-600">
            <p>
              {t.rich("rotateLead", {
                fail: (chunks) => <span className="text-red-600">{chunks}</span>,
              })}
            </p>
            <form action={rotateDeployKeyAction}>
              <input type="hidden" name="siteId" value={site.id} />
              <ProgressButton
                expectedSeconds={8}
                pendingLabel={t("rotating")}
                buildSiteId={site.id}
                className="rounded border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-50"
              >
                {t("rotate")}
              </ProgressButton>
            </form>
            <p className="text-xs text-neutral-400">
              {t("rotateHintBefore")}{" "}
              <a
                href={`https://github.com/${site.dataRepo}/actions`}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-neutral-600"
              >
                {t("actionsOf", { repo: site.dataRepo })}
              </a>{" "}
              {t("rotateHintAfter")}
            </p>
          </div>
        </section>
        <section className="w-full max-w-3xl rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">{t("githubApp")}</h2>
          <div className="space-y-3 p-5 text-sm leading-relaxed text-neutral-600">
            {permissionGap ? (
              <p>
                {t("gapLead", {
                  account: permissionGap.accountLogin,
                  missing: permissionGap.missing
                    .map((item) => (tg.has(item.name) ? tg(item.name) : item.label))
                    .join(" · "),
                })}
              </p>
            ) : (
              <p>{t("noGapLead")}</p>
            )}
            <a
              href={
                permissionGap?.reviewUrl ??
                `https://github.com/settings/installations/${installation.installationId}`
              }
              className={`inline-block rounded px-4 py-2 font-medium ${
                permissionGap
                  ? "bg-amber-800 text-white hover:bg-amber-900"
                  : "border border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              {permissionGap ? t("reviewPerms") : t("manageInstall")}
            </a>
            <p className="text-xs text-neutral-400">{t("githubAppHint")}</p>
          </div>
        </section>
        <section
          id="remove"
          className="w-full max-w-3xl rounded border border-red-200 bg-white shadow-sm"
        >
          <h2 className="border-b border-red-100 px-5 py-3 text-sm font-semibold text-red-800">
            {td("title")}
          </h2>
          <div className="space-y-3 p-5 text-sm leading-relaxed text-neutral-600">
            <p>{td("lead")}</p>
            <p>{td("notDeleteGithub")}</p>
            <p>{td("ifReposRemain")}</p>
            <p className="font-mono text-xs">
              <a
                href={`https://github.com/${site.dataRepo}`}
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                {site.dataRepo}
              </a>
              {" · "}
              <a
                href={`https://github.com/${site.siteRepo}`}
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                {site.siteRepo}
              </a>
            </p>
            <DisconnectSiteForm siteId={site.id} siteName={site.name} slug={site.slug} />
          </div>
        </section>
      </SettingsPanel>
    </SettingsWorkspace>
  );
}
