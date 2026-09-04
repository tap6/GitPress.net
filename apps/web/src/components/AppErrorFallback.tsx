"use client";

import { Component, type ReactNode } from "react";
import { GitPressBrand } from "@/components/GitPressBrand";

function isEnglishPath(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname === "/en" || window.location.pathname.startsWith("/en/");
}

export function AppErrorFallback({ reset }: { reset: () => void }) {
  const en = isEnglishPath();
  const home = en ? "/en" : "/";
  const dashboard = en ? "/en/dashboard" : "/dashboard";
  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <a href={home} className="inline-flex">
        <GitPressBrand href={null} />
      </a>
      <h1 className="mt-8 text-2xl font-bold text-neutral-900">
        {en ? "This page hit a problem" : "这一页出了问题"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">
        {en
          ? "If you were creating a site, open My sites — the record may already be there. If not, submit again with the same slug; leftover empty repos will be filled in. Do not pick a new name."
          : "如果刚点了「创建站点」，先打开「我的站点」看有没有新站。没有的话，用同一个标识符再提交一次，半成品仓库会接着写完。不要换一个新名字。"}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-gp-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          {en ? "Try again" : "再试一次"}
        </button>
        <a
          href={dashboard}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          {en ? "My sites" : "我的站点"}
        </a>
      </div>
    </div>
  );
}

interface BoundaryProps {
  children: ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

export class AppErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.failed) {
      return <AppErrorFallback reset={() => this.setState({ failed: false })} />;
    }
    return this.props.children;
  }
}
