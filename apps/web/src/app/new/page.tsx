import Link from "next/link";
import { NewSiteForm } from "@/components/NewSiteForm";
import { githubAppInstallUrl } from "@/lib/github";
import { listUserInstallations, requireUser } from "@/lib/sites";
import { BUILTIN_THEMES } from "@/lib/themes";

export const metadata = { title: "创建站点" };

export default async function NewSitePage() {
  const user = await requireUser();
  const installations = await listUserInstallations(user.id);

  let installUrl = "#";
  try {
    installUrl = githubAppInstallUrl();
  } catch {
    // GitHub App not configured yet — surfaced below.
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
            ← 我的站点
          </Link>
          <p className="text-lg font-bold tracking-tight">
            Git<span className="text-gp-brand">Press</span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold">创建新站点</h1>

        {installations.length === 0 ? (
          <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold">第一步:连接 GitHub</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
              GitPress 需要安装 GitHub App 才能在你的账号下创建两个仓库:
              <strong>私有数据仓库</strong>(文章与草稿)和
              <strong>公开网站仓库</strong>(编译后的页面)。
              安装时请选择「All repositories」,以便新建的仓库自动获得授权。
            </p>
            {installUrl === "#" ? (
              <p className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                平台尚未配置 GitHub App(<code>GITHUB_APP_SLUG</code> 等环境变量),
                请参考 <code>apps/web/.env.example</code> 完成配置。
              </p>
            ) : (
              <a
                href={installUrl}
                className="mt-6 inline-block rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
              >
                安装 GitPress GitHub App
              </a>
            )}
          </div>
        ) : (
          <NewSiteForm
            installations={installations.map((installation) => ({
              id: installation.id,
              label: `${installation.accountLogin} (${installation.accountType === "Organization" ? "组织" : "个人"})`,
            }))}
            themes={BUILTIN_THEMES}
            connectMoreUrl={installUrl}
          />
        )}
      </main>
    </div>
  );
}
