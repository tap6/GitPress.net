"use client";

import Link from "next/link";
import { ConfirmForm } from "@/components/ConfirmForm";
import { ProgressButton } from "@/components/ProgressButton";
import { deletePageAction } from "@/lib/actions";
import type { SitePage } from "@/lib/content";

interface Props {
  siteId: string;
  pages: SitePage[];
}

export function PagesTable({ siteId, pages }: Props) {
  return (
    <div className="mt-4 overflow-hidden rounded border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-2.5">标题</th>
              <th className="hidden w-48 px-4 py-2.5 md:table-cell">地址</th>
              <th className="w-16 px-3 py-2.5">
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-neutral-400">
                  还没有页面,点击「写页面」开始。开通站点时会自动生成 About。
                </td>
              </tr>
            )}
            {pages.map((page) => {
              const editHref = `/sites/${siteId}/pages/edit?path=${encodeURIComponent(page.path)}`;
              return (
                <tr key={page.path} className="border-b border-neutral-100 hover:bg-neutral-50/80">
                  <td className="px-4 py-3">
                    <Link href={editHref} className="font-medium text-wp-accent hover:underline">
                      {page.title}
                    </Link>
                    {page.description && (
                      <p className="mt-0.5 truncate text-xs text-neutral-400">{page.description}</p>
                    )}
                    <p className="mt-1 text-xs text-neutral-400 md:hidden">/{page.slug}/</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs">
                      <Link
                        href={editHref}
                        className="text-neutral-400 hover:text-wp-accent hover:underline"
                      >
                        编辑
                      </Link>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">/{page.slug}/</td>
                  <td className="px-3 py-3 text-right">
                    <ConfirmForm
                      action={deletePageAction}
                      message={`确定删除页面「${page.title}」?此操作会从数据仓库移除文件。`}
                    >
                      <input type="hidden" name="siteId" value={siteId} />
                      <input type="hidden" name="path" value={page.path} />
                      <ProgressButton
                        expectedSeconds={3}
                        pendingLabel="删除中"
                        buildSiteId={siteId}
                        className="text-xs text-neutral-400 hover:text-red-600 hover:underline"
                      >
                        删除
                      </ProgressButton>
                    </ConfirmForm>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
