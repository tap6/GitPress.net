import type { PermissionGap } from "@/lib/github";

interface Props {
  gap: PermissionGap;
  compact?: boolean;
}

/**
 * GitHub will not let a third-party site accept App permission upgrades —
 * the account owner has to confirm on github.com. This banner is the in-app
 * notice they never get from GitHub itself (GitHub only emails the installer,
 * and that mail is easy to miss).
 */
export function PermissionUpdateBanner({ gap, compact = false }: Props) {
  const missing = gap.missing.map((item) => item.label).join("、");
  return (
    <div
      className={
        compact
          ? "rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          : "border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 sm:px-8"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          GitHub App 权限已更新,账号 <strong>{gap.accountLogin}</strong> 尚未批准
          {missing ? `（还差：${missing}）` : ""}。GitHub 不允许在本站直接授权,需要到
          GitHub 点一次确认,大约 10 秒。
        </p>
        <a
          href={gap.reviewUrl}
          className="shrink-0 rounded bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900"
        >
          前往 GitHub 批准
        </a>
      </div>
    </div>
  );
}
