"use client";

import { useState } from "react";
import { ThemeCard } from "@/components/ThemeCard";
import { ThemeDetailModal } from "@/components/ThemeDetailModal";
import type { ThemeShelfItem } from "@/lib/themeShelf";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-6">
      <h2 className="text-sm font-semibold text-neutral-700">{title}</h2>
      {hint ? <p className="mt-1 text-xs text-neutral-400">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Grid({
  siteId,
  items,
  onOpen,
}: {
  siteId: string;
  items: ThemeShelfItem[];
  onOpen: (item: ThemeShelfItem) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <ThemeCard key={`${item.kind}-${item.id}`} siteId={siteId} item={item} onOpen={() => onOpen(item)} />
      ))}
    </div>
  );
}

export function ThemeShelf({
  siteId,
  official,
  listed,
  library,
}: {
  siteId: string;
  official: ThemeShelfItem[];
  listed: ThemeShelfItem[];
  library: ThemeShelfItem[];
}) {
  const [open, setOpen] = useState<ThemeShelfItem | null>(null);

  return (
    <>
      <Section title="官方" hint="GitPress 内置主题,构建时从 tap6/gitpress@v1 拉取。">
        <Grid siteId={siteId} items={official} onOpen={setOpen} />
      </Section>
      {listed.length > 0 ? (
        <Section title="已收录" hint="经过官方验收上架的社区主题。启用后由你的 Actions 去 GitHub 拉取。">
          <Grid siteId={siteId} items={listed} onOpen={setOpen} />
        </Section>
      ) : null}
      <Section
        title="我的导入"
        hint={
          library.length === 0
            ? "把公开 GitHub 主题加到本站列表,需要时再启用。不会写入文章仓库。"
            : "仅本站可见。从列表移除不会卸载 GitHub 上的主题。"
        }
      >
        {library.length === 0 ? (
          <p className="text-sm text-neutral-400">还没有导入主题,用下方表单添加。</p>
        ) : (
          <Grid siteId={siteId} items={library} onOpen={setOpen} />
        )}
      </Section>
      {open ? <ThemeDetailModal siteId={siteId} item={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}
