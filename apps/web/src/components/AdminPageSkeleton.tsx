/** Shared loading shell for `/sites/[siteId]/*` so the sidebar stays put. */
export function AdminPageSkeleton() {
  return (
    <div className="max-w-6xl animate-pulse">
      <div className="h-8 w-36 rounded bg-neutral-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="h-24 rounded border border-neutral-200 bg-white" />
        <div className="h-24 rounded border border-neutral-200 bg-white" />
        <div className="h-24 rounded border border-neutral-200 bg-white" />
      </div>
      <div className="mt-6 h-56 rounded border border-neutral-200 bg-white" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="h-48 rounded border border-neutral-200 bg-white" />
        <div className="h-48 rounded border border-neutral-200 bg-white" />
      </div>
    </div>
  );
}
