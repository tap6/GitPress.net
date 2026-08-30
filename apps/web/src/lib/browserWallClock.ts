"use client";

import { useLayoutEffect, useState } from "react";
import { CLIENT_NOW_FIELD, TZ_OFFSET_FIELD, nowLocalDateTime } from "./postDate";
import { dateInputMax } from "./publishCheck";

function setHidden(form: HTMLFormElement, name: string, value: string): void {
  let input = form.querySelector<HTMLInputElement>(`input[name="${CSS.escape(name)}"]`);
  if (!input) {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    form.appendChild(input);
  }
  input.value = value;
}

/** Stamp the author's wall clock so the server does not use Vercel's UTC `Date`. */
export function stampAuthorNow(form: HTMLFormElement): void {
  setHidden(form, CLIENT_NOW_FIELD, nowLocalDateTime());
  setHidden(form, TZ_OFFSET_FIELD, String(new Date().getTimezoneOffset()));
}

export function onFormStampAuthorNow(event: { currentTarget: HTMLFormElement }): void {
  stampAuthorNow(event.currentTarget);
}

/** `null` until mount, so SSR/hydration never bake in the server timezone. */
export function useBrowserWallClock(): string | null {
  const [now, setNow] = useState<string | null>(null);
  useLayoutEffect(() => {
    const tick = () => setNow(nowLocalDateTime());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function useDateInputMax(enabled: boolean, previousDate: string | null): string | undefined {
  const now = useBrowserWallClock();
  if (enabled || now == null) return undefined;
  return dateInputMax(false, previousDate, now);
}
