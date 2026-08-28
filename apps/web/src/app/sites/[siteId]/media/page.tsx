import { deleteMediaAction, uploadMediaAction } from "@/lib/actions";
import { ProgressButton } from "@/components/ProgressButton";
import { cachedListMedia } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "媒体" };

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function MediaPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { site, installation } = await requireSite(siteId);
  const media = await cachedListMedia(installation.installationId, site.dataRepo);

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-normal text-neutral-800">媒体库</h1>

      <form
        action={uploadMediaAction}
        className="mt-5 flex items-center gap-3 rounded border border-dashed border-neutral-300 bg-white p-5 shadow-sm"
      >
        <input type="hidden" name="siteId" value={site.id} />
        <input type="file" name="file" accept="image/*" required className="text-sm" />
        <ProgressButton
          expectedSeconds={8}
          pendingLabel="上传中"
          buildSiteId={site.id}
          className="rounded bg-wp-accent px-4 py-2 text-sm font-medium text-white hover:bg-wp-accent-dark"
        >
          上传到数据仓库
        </ProgressButton>
        <span className="text-xs text-neutral-400">
          单个文件 ≤ 8MB。这里会立即写入仓库并触发一次构建;写文章时插入的图会等到保存文章再一起提交。
        </span>
      </form>

      {media.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-400">媒体库为空。上传的图片保存在数据仓库的 media/ 目录。</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {media.map((item) => (
            <div
              key={item.path}
              className="overflow-hidden rounded border border-neutral-200 bg-white shadow-sm"
            >
              {item.downloadUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.downloadUrl}
                  alt={item.name}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-neutral-300">
                  文件
                </div>
              )}
              <div className="p-2.5">
                <p className="truncate text-xs font-medium" title={item.name}>
                  {item.name}
                </p>
                <div className="mt-1 flex items-center justify-between text-xs text-neutral-400">
                  <span>{formatSize(item.size)}</span>
                  <form action={deleteMediaAction}>
                    <input type="hidden" name="siteId" value={site.id} />
                    <input type="hidden" name="path" value={item.path} />
                    <ProgressButton
                      expectedSeconds={3}
                      pendingLabel="删除中"
                      buildSiteId={site.id}
                      className="text-red-500 hover:underline"
                    >
                      删除
                    </ProgressButton>
                  </form>
                </div>
                <p className="mt-1 select-all break-all text-[10px] text-neutral-400">
                  /{item.path}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-neutral-400">
        在文章中引用:<code>![说明](/media/文件名.jpg)</code>
      </p>
    </div>
  );
}
