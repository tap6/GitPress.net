import { redirect } from "next/navigation";
import { auth, providerIds, signIn } from "@/auth";

const PROVIDER_META: Record<string, { label: string; className: string }> = {
  google: { label: "使用 Google 登录", className: "bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50" },
  github: { label: "使用 GitHub 登录", className: "bg-neutral-900 text-white hover:bg-neutral-700" },
  "microsoft-entra-id": { label: "使用 Microsoft 登录", className: "bg-[#2f2f2f] text-white hover:bg-[#444]" },
  twitter: { label: "使用 X 登录", className: "bg-black text-white hover:bg-neutral-800" },
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-center text-2xl font-bold tracking-tight">
          Git<span className="text-gp-brand">Press</span>
        </p>
        <p className="mt-2 text-center text-sm text-neutral-500">
          登录后即可创建部署在你自己 GitHub 上的博客
        </p>
        <div className="mt-8 space-y-3">
          {providerIds.length === 0 && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              尚未配置任何登录方式。请在 <code>.env.local</code> 中填入至少一组
              OAuth 凭据(参考 <code>.env.example</code>)。
            </p>
          )}
          {providerIds.map((id) => {
            const meta = PROVIDER_META[id] ?? {
              label: `使用 ${id} 登录`,
              className: "bg-neutral-900 text-white",
            };
            return (
              <form
                key={id}
                action={async () => {
                  "use server";
                  await signIn(id, { redirectTo: "/dashboard" });
                }}
              >
                <button
                  type="submit"
                  className={`w-full rounded-md px-4 py-2.5 text-sm font-medium transition ${meta.className}`}
                >
                  {meta.label}
                </button>
              </form>
            );
          })}
        </div>
        <p className="mt-8 text-center text-xs text-neutral-400">
          登录方式与 GitHub 仓库授权相互独立,你可以用 Google 登录后再接入 GitHub。
        </p>
        {providerIds.includes("github") && (
          <p className="mt-2 text-center text-xs text-neutral-400">
            已经授权过的浏览器点击「使用 GitHub 登录」会直接免确认登入。想切换到另一个
            GitHub 账号?先去{" "}
            <a
              href="https://github.com/logout"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-neutral-600"
            >
              github.com 退出登录
            </a>{" "}
            再回来点登录。
          </p>
        )}
      </div>
    </div>
  );
}
