"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import * as En from "@/content/help/hosting-en";
import * as Zh from "@/content/help/hosting-zh";
import type { HostingKind } from "@/components/HostingGuideUi";

export type { HostingKind } from "@/components/HostingGuideUi";
export {
  Callout,
  DnsTable,
  HostingOptionButtons,
  isHostingKind,
  useHostingKindHash,
} from "@/components/HostingGuideUi";

function useHostingLocale() {
  return useLocale() === "en" ? En : Zh;
}

export function HostingWhyNotes() {
  const Copy = useHostingLocale();
  return <Copy.HostingWhyNotes />;
}

export function DomainKindNotes() {
  const Copy = useHostingLocale();
  return <Copy.DomainKindNotes />;
}

export function HostingPitfalls() {
  const Copy = useHostingLocale();
  return <Copy.HostingPitfalls />;
}

export function HostingSteps({
  host,
  variant,
  siteRepo,
  pagesDns,
}: {
  host: HostingKind;
  variant: "help" | "settings";
  siteRepo?: string;
  pagesDns?: ReactNode;
}) {
  const Copy = useHostingLocale();
  return <Copy.HostingSteps host={host} variant={variant} siteRepo={siteRepo} pagesDns={pagesDns} />;
}
