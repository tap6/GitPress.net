import { uploadMediaAction } from "@/lib/actions";
import { MediaGrid } from "@/components/MediaGrid";
import { ProgressButton } from "@/components/ProgressButton";
import { MEDIA_LIBRARY_ACCEPT } from "@/lib/mediaTypes";
import { cachedListMedia } from "@/lib/siteDataCache";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "媒体" };

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
      <p className="mt-2 text-sm text-neutral-500">
        支持图片与常见短视频(mp4/webm/mov)预览。文件保存在私有数据仓库的{" "}
        <code className="text-xs">media/</code> 目录,构建后会出现在公开站点的{" "}
        <code className="text-xs">/media/...</code> 路径下。
      </p>

      <form
        action={uploadMediaAction}
        className="mt-5 flex flex-wrap items-center gap-3 rounded border border-dashed border-neutral-300 bg-white p-5 shadow-sm"
      >
        <input type="hidden" name="siteId" value={site.id} />
        <input
          type="file"
          name="file"
          accept={MEDIA_LIBRARY_ACCEPT}
          required
          className="text-sm"
        />
        <ProgressButton
          expectedSeconds={8}
          pendingLabel="上传中"
          buildSiteId={site.id}
          className="rounded bg-wp-accent px-4 py-2 text-sm font-medium text-white hover:bg-wp-accent-dark"
        >
          上传到数据仓库
        </ProgressButton>
        <span className="text-xs text-neutral-400">
          单个文件 ≤ 8MB。媒体库上传会立即写入仓库并触发一次构建;写文章时插入的图片会等到保存文章再一起提交。
        </span>
      </form>

      {media.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-400">
          媒体库为空。上传图片或视频后,点击缩略图或「预览」可全屏查看。
        </p>
      ) : (
        <MediaGrid siteId={site.id} items={media} />
      )}

      <div className="mt-4 space-y-1 text-xs text-neutral-400">
        <p>
          图片引用:<code className="ml-1">![说明](/media/文件名.jpg)</code>
        </p>
        <p>
          视频引用(HTML):
          <code className="ml-1">{`<video src="/media/文件名.mp4" controls></video>`}</code>
        </p>
      </div>
    </div>
  );
}
