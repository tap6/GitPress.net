import Link from "next/link";
import { AdminMenu } from "@/components/AdminMenu";
import { requireSite } from "@/lib/sites";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, user } = await requireSite(siteId);

  return (
    <div className="flex min-h-screen bg-wp-canvas">
      {/* Sidebar */}
      <aside className="w-40 shrink-0 bg-wp-base">
        <div className="border-b border-white/10 px-4 py-3">
          <Link href="/dashboard" className="text-sm font-bold text-white">
            Git<span className="text-gp-brand">Press</span>
          </Link>
        </div>
        <AdminMenu siteId={site.id} />
        <div className="mt-6 border-t border-white/10 px-4 py-3">
          <Link
            href="/dashboard"
            className="text-xs text-wp-sidebar-text hover:text-white"
          >
            ← 全部站点
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Admin bar */}
        <div className="flex items-center justify-between bg-wp-base px-5 py-1.5 text-[13px] text-wp-sidebar-text">
          <div className="flex items-center gap-2">
            <span className="text-white">{site.name}</span>
            {site.url && (
              <a
                href={site.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#72aee6]"
              >
                访问站点 ↗
              </a>
            )}
          </div>
          <span>你好,{user.name ?? "博主"}</span>
        </div>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
