export function OpsSearch({
  action,
  q,
  placeholder,
}: {
  action: string;
  q?: string;
  placeholder: string;
}) {
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder={placeholder}
        className="w-72 max-w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-ops-accent focus:outline-none"
      />
      <button type="submit" className="rounded bg-ops-ink px-3 py-1.5 text-sm text-white hover:bg-slate-800">
        搜索
      </button>
      {q ? (
        <a href={action} className="text-sm text-slate-500 hover:text-slate-800">
          清除
        </a>
      ) : null}
    </form>
  );
}
