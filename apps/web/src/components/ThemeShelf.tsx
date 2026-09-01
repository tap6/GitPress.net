"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("themeShelf");
  const ta = useTranslations("appearance");
  const [open, setOpen] = useState<ThemeShelfItem | null>(null);

  return (
    <>
      <Section title={t("official")} hint={ta("officialHint")}>
        <Grid siteId={siteId} items={official} onOpen={setOpen} />
      </Section>
      {listed.length > 0 ? (
        <Section title={t("listed")} hint={ta("listedHint")}>
          <Grid siteId={siteId} items={listed} onOpen={setOpen} />
        </Section>
      ) : null}
      <Section
        title={ta("mine")}
        hint={library.length === 0 ? ta("mineEmptyHint") : ta("mineHint")}
      >
        {library.length === 0 ? (
          <p className="text-sm text-neutral-400">{ta("mineEmpty")}</p>
        ) : (
          <Grid siteId={siteId} items={library} onOpen={setOpen} />
        )}
      </Section>
      {open ? <ThemeDetailModal siteId={siteId} item={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}
