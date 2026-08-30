"use client";

import Link from "next/link";
import { useBrowserWallClock } from "@/lib/browserWallClock";
import { listScheduledPosts } from "@/lib/publishCheck";

export function ScheduledWhileOffBanner({
  siteId,
  posts,
}: {
  siteId: string;
  posts: Array<{ title: string; path: string; date: string | null; draft: boolean }>;
}) {
  const now = useBrowserWallClock();
  const scheduled = now ? listScheduledPosts(posts, now) : [];
  if (scheduled.length === 0) return null;

  return (
    <div className="mt-4 rounded border-l-4 border-amber-400 bg-white p-4 text-sm shadow-sm">
      <p>
        有 {scheduled.length} 篇已发布文章的日期还在未来，但定时发布检查是关的，到点后不会自动出现。
        打开{" "}
        <Link href={`/sites/${siteId}/settings#publish`} className="text-wp-accent hover:underline">
          设置 → 定时发布
        </Link>
        ，或到期后保存 / 手动重建。
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-600">
        {scheduled.slice(0, 5).map((post) => (
          <li key={post.path}>
            <Link
              href={`/sites/${siteId}/posts/edit?path=${encodeURIComponent(post.path)}`}
              className="hover:underline"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
