import Link from "next/link";
import { signOut } from "@/auth";
import { listUserSites, requireUser } from "@/lib/sites";

export const metadata = { title: "我的站点" };

export default async function DashboardPage() {
  const user = await requireUser();
  const userSites = await listUserSites(user.id);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Git<span className="text-gp-brand">Press</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/account/ai" className="text-neutral-500 hover:text-neutral-900">
              AI 设置
            </Link>
            <span className="text-neutral-500">{user.name ?? user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="text-neutral-400 hover:text-neutral-700">退出</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">我的站点</h1>
          <Link
            href="/new"
            className="rounded-md bg-gp-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            + 创建新站点
          </Link>
        </div>

        {userSites.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <p className="text-lg font-medium">还没有站点</p>
            <p className="mt-2 text-sm text-neutral-500">
              连接 GitHub 后,几十秒即可拥有一个部署在你自己仓库上的博客。
            </p>
            <Link
              href="/new"
              className="mt-6 inline-block rounded-md bg-gp-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              创建第一个站点
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {userSites.map((site) => (
              <li
                key={site.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-5"
              >
                <div>
                  <Link
                    href={`/sites/${site.id}`}
                    className="font-semibold hover:text-gp-brand"
                  >
                    {site.name}
                  </Link>
                  <p className="mt-1 text-xs text-neutral-400">
                    {site.dataRepo} · 主题 {site.themeName}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {site.url && (
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-500 hover:text-neutral-900"
                    >
                      访问 ↗
                    </a>
                  )}
                  <Link
                    href={`/sites/${site.id}`}
                    className="rounded-md bg-wp-accent px-3 py-1.5 font-medium text-white hover:bg-wp-accent-dark"
                  >
                    管理后台
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
