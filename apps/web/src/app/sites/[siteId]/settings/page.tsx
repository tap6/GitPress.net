import { BrandMediaForm } from "@/components/BrandMediaForm";
import { CustomDomainForm } from "@/components/CustomDomainForm";
import { rotateDeployKeyAction } from "@/lib/actions";
import { AiSettingsForm } from "@/components/AiSettingsForm";
import { ProgressButton } from "@/components/ProgressButton";
import { SettingsForm } from "@/components/SettingsForm";
import { getAiConfig } from "@/lib/ai";
import { githubPagesDefaultUrl } from "@/lib/customDomain";
import { getInstallationOctokit, getInstallationPermissionGap, getPagesSite, splitRepo } from "@/lib/github";
import { cachedSiteConfig } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "设置" };

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
  const [config, permissionGap, aiConfig, pages] = await Promise.all([
    cachedSiteConfig(installation.installationId, site.dataRepo),
    getInstallationPermissionGap(installation.installationId),
    getAiConfig(user.id),
    getPagesSite(await getInstallationOctokit(installation.installationId), splitRepo(site.siteRepo)),
  ]);
  const analyticsSnippet =
    typeof config?.site.analyticsSnippet === "string" ? config.site.analyticsSnippet : "";
  const logo = typeof config?.site.logo === "string" ? config.site.logo : "";
  const avatar = typeof config?.site.avatar === "string" ? config.site.avatar : "";

  return (
    <div>
      <h1 className="text-2xl font-normal text-neutral-800">设置</h1>

      <div className="gp-settings-pack mt-5">
        <section className="gp-settings-card gp-settings-card--general rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="shrink-0 border-b border-neutral-100 px-5 py-3 text-sm font-semibold">常规</h2>
          <div className="gp-settings-card__body">
            <SettingsForm
              siteId={site.id}
              initial={{
                name: site.name,
                description: site.description ?? "",
                language: site.language,
                analyticsSnippet,
              }}
            />
          </div>
        </section>

        <section className="gp-settings-card gp-settings-card--brand rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="shrink-0 border-b border-neutral-100 px-5 py-3 text-sm font-semibold">Logo 与头像</h2>
          <div className="gp-settings-card__body">
            <BrandMediaForm siteId={site.id} logo={logo} avatar={avatar} />
          </div>
        </section>

        <section
          id="account-ai"
          className="gp-settings-card gp-settings-card--ai scroll-mt-16 rounded border border-neutral-200 bg-white shadow-sm"
        >
          <h2 className="shrink-0 border-b border-neutral-100 px-5 py-3 text-sm font-semibold">
            账号 · 全局设置
          </h2>
          <div className="gp-settings-card__body space-y-3 p-5">
            <p className="text-sm text-neutral-500">
              以下配置跟账号走,对你名下所有站点生效,不用再回到「我的站点」首页修改。
            </p>
            <h3 className="text-sm font-medium text-neutral-800">AI 写作</h3>
            <p className="text-xs text-neutral-400">
              用于文章编辑器里的「生成摘要」和「生成初稿」。任意 OpenAI 兼容接口均可。
            </p>
            <AiSettingsForm
              embedded
              hasExisting={aiConfig !== null}
              initial={{ baseUrl: aiConfig?.baseUrl ?? "", model: aiConfig?.model ?? "" }}
            />
          </div>
        </section>

        <section
          id="domain"
          className="gp-settings-card gp-settings-card--domain scroll-mt-16 rounded border border-neutral-200 bg-white shadow-sm"
        >
          <h2 className="shrink-0 border-b border-neutral-100 px-5 py-3 text-sm font-semibold">自定义域名</h2>
          <div className="gp-settings-card__body">
            <CustomDomainForm
              siteId={site.id}
              siteRepo={site.siteRepo}
              currentUrl={site.url}
              defaultUrl={githubPagesDefaultUrl(site.siteRepo)}
              pagesCname={pages?.cname ?? null}
              certificateState={pages?.certificateState ?? null}
              notice={domainNotice === "saved" || domainNotice === "removed" ? domainNotice : null}
            />
          </div>
        </section>

        <section className="gp-settings-card gp-settings-card--note rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="shrink-0 border-b border-neutral-100 px-5 py-3 text-sm font-semibold">部署</h2>
          <div className="gp-settings-card__body space-y-3 p-5 text-sm leading-relaxed text-neutral-600">
            <p className="break-all">
              当前地址:
              {site.url ? (
                <a href={site.url} target="_blank" rel="noreferrer" className="ml-1 text-wp-accent hover:underline">
                  {site.url}
                </a>
              ) : (
                <span className="ml-1 text-neutral-400">GitHub Pages 启用中…</span>
              )}
            </p>
            <p>
              默认走 GitHub Pages。想改用 <strong>Vercel</strong>？把公开网站仓库
              <code className="mx-1 break-all rounded bg-neutral-100 px-1.5 py-0.5">{site.siteRepo}</code>
              导入即可（纯静态，无需构建配置）。Vercel 上的域名请在 Vercel 后台添加，不要和上面的
              Pages 自定义域名指到同一条记录。
            </p>
          </div>
        </section>

        <section className="gp-settings-card gp-settings-card--note rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="shrink-0 border-b border-neutral-100 px-5 py-3 text-sm font-semibold">故障排查</h2>
          <div className="gp-settings-card__body space-y-3 p-5 text-sm leading-relaxed text-neutral-600">
            <p>
              如果仪表盘的「最近构建」一直显示 <span className="text-red-600">✗ 失败</span>,
              或者网站仓库始终只有初始的 README(没有随文章更新),通常是发布用的部署密钥格式有问题。
              点击下面按钮会重新生成部署密钥并立即触发一次重建,不影响你的文章内容。
            </p>
            <form action={rotateDeployKeyAction}>
              <input type="hidden" name="siteId" value={site.id} />
              <ProgressButton
                expectedSeconds={8}
                pendingLabel="重新生成中"
                buildSiteId={site.id}
                className="rounded border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-50"
              >
                重新生成部署密钥并重建
              </ProgressButton>
            </form>
            <p className="text-xs text-neutral-400">
              完成后仍需等待约 1–2 分钟让 GitHub Actions 跑完构建。可回仪表盘查看「最近构建」,
              如果那里提示缺少 Actions 权限,也可以直接去{" "}
              <a
                href={`https://github.com/${site.dataRepo}/actions`}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-neutral-600"
              >
                {site.dataRepo} 的 Actions 页面
              </a>{" "}
              查看真实构建状态。
            </p>
          </div>
        </section>

        <section className="gp-settings-card gp-settings-card--note rounded border border-neutral-200 bg-white shadow-sm">
          <h2 className="shrink-0 border-b border-neutral-100 px-5 py-3 text-sm font-semibold">GitHub App</h2>
          <div className="gp-settings-card__body space-y-3 p-5 text-sm leading-relaxed text-neutral-600">
            {permissionGap ? (
              <p>
                检测到安装在 <strong>{permissionGap.accountLogin}</strong> 上的权限尚未与 App
                最新范围对齐(还差：{permissionGap.missing.map((item) => item.label).join("、")})。
                GitHub 规定必须由账号本人在 GitHub 上点一次确认,GitPress 无法代为授权。
              </p>
            ) : (
              <p>
                当前安装看起来已包含 App 请求的全部权限。若构建记录读不到、或刚在 GitHub 上给
                App 加过新权限,可以再走一遍确认页。
              </p>
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
              {permissionGap ? "前往 GitHub 批准新权限" : "管理 GitHub App 安装"}
            </a>
            <p className="text-xs text-neutral-400">
              会打开 GitHub 的安装配置页。若页面顶部有黄色「Review request」或新权限列表,点
              Accept / 批准即可,无需卸载重装。
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
