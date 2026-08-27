import { PostEditor } from "@/components/PostEditor";
import { requireSite } from "@/lib/sites";

export const metadata = { title: "写文章" };

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  await requireSite(siteId);

  return (
    <div>
      <h1 className="mb-5 text-2xl font-normal text-neutral-800">写文章</h1>
      <PostEditor siteId={siteId} />
    </div>
  );
}
