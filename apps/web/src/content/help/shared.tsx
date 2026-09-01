import type { ReactNode } from "react";

export const PLATFORM_REPO = "https://github.com/tap6/GitPress.net";
export const GITPRESS_REPO = "https://github.com/tap6/gitpress";
export const BUILD_ACTION_REPO = "https://github.com/tap6/build-action";

export const HELP_BODY = "text-sm leading-relaxed text-neutral-700";
export const HELP_BODY_MUTED = "text-sm leading-relaxed text-neutral-500";
export const helpCode = "rounded bg-neutral-100 px-1 font-mono text-[0.9em]";

export function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function Mark({ children }: { children: ReactNode }) {
  return (
    <mark className="box-decoration-clone rounded bg-gp-brand/12 px-1 py-px font-medium text-neutral-900">
      {children}
    </mark>
  );
}

export function RepoCard({
  featured,
  label,
  name,
  body,
  href,
  openLabel,
}: {
  featured?: boolean;
  label: string;
  name: string;
  body: string;
  href: string;
  openLabel: string;
}) {
  return (
    <a
      href={href}
      className={`group block rounded-lg border p-5 transition-colors ${
        featured
          ? "border-gp-brand/35 bg-white shadow-sm ring-1 ring-gp-brand/10"
          : "border-neutral-200 bg-white hover:border-neutral-300"
      }`}
      target="_blank"
      rel="noreferrer"
    >
      <p className={`text-xs font-medium ${featured ? "text-gp-brand" : "text-neutral-400"}`}>{label}</p>
      <p className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-neutral-900">
        <GitHubMark className="h-4 w-4 shrink-0 text-neutral-500" />
        {name}
      </p>
      <p className={`mt-2 ${HELP_BODY}`}>{body}</p>
      <p className="mt-3 text-xs font-medium text-neutral-500 group-hover:text-neutral-800">{openLabel}</p>
    </a>
  );
}
