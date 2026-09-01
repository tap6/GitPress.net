"use client";

import { useTranslations } from "next-intl";

const JOIN_URL = "https://qm.qq.com/q/vPMa0TpENq";

export function QqGroupFloat() {
  const t = useTranslations("qq");
  return (
    <a
      href={JOIN_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={t("join")}
      className="group fixed bottom-5 right-5 z-50 sm:bottom-8 sm:right-8"
    >
      <span className="pointer-events-none invisible absolute bottom-full right-0 w-52 origin-bottom-right translate-y-1 scale-95 pb-3 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:pointer-events-auto group-focus-visible:visible group-focus-visible:translate-y-0 group-focus-visible:scale-100 group-focus-visible:opacity-100 sm:w-56">
        <img src="/qq-group.webp" alt={t("alt")} className="block w-full rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] ring-1 ring-white/20" />
      </span>
      <span className="relative flex h-12 items-center gap-2 rounded-full bg-[#12b7f5] pl-1.5 pr-3.5 text-sm font-medium text-white shadow-lg transition group-hover:brightness-110 group-focus-visible:brightness-110">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M21.395 15.035a39.546 39.546 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 16.226 0 12.001 0 7.714 0 4.473 4.632 4.473 9.241c0 .274.013.804.014.836l-1.08 2.695a39.546 39.546 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673z" />
          </svg>
        </span>
        {t("label")}
      </span>
    </a>
  );
}
