"use client";

export interface ImageUploadTask {
  id: string;
  name: string;
  preview: string;
  status: "uploading" | "done" | "error";
  error?: string;
}

/**
 * Bottom-right queue for editor image uploads. GitHub Contents commits take
 * several seconds; putting progress next to a broken <img> (or only in the
 * toolbar) made it look like the insert had failed.
 */
export function ImageUploadTray({
  tasks,
  onDismiss,
}: {
  tasks: ImageUploadTask[];
  onDismiss: (id: string) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-50 w-72 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl">
      <div className="border-b border-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-700">
        图片上传
      </div>
      <ul className="max-h-64 overflow-y-auto">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2 border-b border-neutral-50 px-3 py-2 last:border-0">
            {task.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={task.preview} alt="" className="h-9 w-9 shrink-0 rounded object-cover bg-neutral-100" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-neutral-100 text-[10px] text-neutral-400">
                图
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-neutral-800">{task.name}</p>
              {task.status === "uploading" && (
                <>
                  <p className="text-[11px] text-neutral-400">正在写入数据仓库…</p>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-neutral-100">
                    <span className="route-loading-bar-fill block h-full w-1/3 bg-wp-accent" />
                  </span>
                </>
              )}
              {task.status === "done" && (
                <p className="text-[11px] text-emerald-600">已插入文章</p>
              )}
              {task.status === "error" && (
                <p className="truncate text-[11px] text-red-600">{task.error ?? "上传失败"}</p>
              )}
            </div>
            {task.status !== "uploading" && (
              <button
                type="button"
                onClick={() => onDismiss(task.id)}
                className="shrink-0 text-xs text-neutral-300 hover:text-neutral-600"
                aria-label="关闭"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
