import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "从 GitHub 导入主题",
  description:
    "GitPress 不会把主题装到服务器上。先把公开仓库加到本站「我的导入」,启用后才由 Actions 拉取并编译。",
};

export default function ImportThemeHelpPage() {
  return (
    <>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gp-brand">帮助</p>
        <p className="mt-2">
          <Link href="/help" className="text-sm text-neutral-500 hover:text-neutral-900">
            ← 全部帮助
          </Link>
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          从 GitHub 导入主题
        </h1>
        <p className="mt-4 text-neutral-500 leading-relaxed">
          这和 WordPress 的「上传 zip、解压到服务器」不是一回事。GitPress
          的主题源码一直住在 GitHub 上;你的站点只记住「去哪个仓库、哪个版本」,真正拉代码的是每次构建时的
          GitHub Actions。
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">主题装在哪?</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            <strong>不装在 GitPress.net 的服务器上</strong>,也不拷进你的文章仓库。
            私有数据仓库里的 <code className="rounded bg-neutral-100 px-1">gitpress.json</code>{" "}
            只存一份指针,例如:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100">
            {`"theme": {
  "name": "classic",
  "source": "builtin",
  "ref": "v1",
  "config": { "showAvatar": true }
}`}
          </pre>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            内置主题的 <code className="rounded bg-neutral-100 px-1">source</code> 是{" "}
            <code className="rounded bg-neutral-100 px-1">builtin</code>,实际会去官方公开仓库{" "}
            <a
              href="https://github.com/tap6/gitpress"
              className="underline hover:text-neutral-800"
              target="_blank"
              rel="noreferrer"
            >
              tap6/gitpress
            </a>{" "}
            的 <code className="rounded bg-neutral-100 px-1">themes/主题名/</code>,并锁定标签{" "}
            <code className="rounded bg-neutral-100 px-1">v1</code>。
            导入主题则写成{" "}
            <code className="rounded bg-neutral-100 px-1">github:用户名/仓库名#分支或标签</code>。
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">点「添加到我的主题」之后发生了什么</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
            <li>后台先访问该仓库的 <code className="rounded bg-neutral-100 px-1">theme.json</code>,确认是 GitPress spec v1、引擎是 Astro。</li>
            <li>把仓库地址记到本站的「我的导入」列表(存在 GitPress 控制面,不写入你的文章仓库)。这时还不会换主题、也不会重建。</li>
            <li>你在外观页点「启用」后,才把指针写进数据仓库 <code className="rounded bg-neutral-100 px-1">gitpress.json</code>。</li>
            <li>数据仓库的 push 触发 GitHub Actions。</li>
            <li>Action 在 GitHub 的构建机器上 <code className="rounded bg-neutral-100 px-1">git clone</code> 那个主题仓库,把你的文章和图片挂进去,执行 <code className="rounded bg-neutral-100 px-1">astro build</code>。</li>
            <li>只有编译好的 HTML/CSS 被推到公开网站仓库,供 GitHub Pages 托管。主题源码不会留在网站仓库里。</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">表单里三栏怎么填</h2>
          <dl className="mt-3 space-y-4 text-sm leading-relaxed text-neutral-600">
            <div>
              <dt className="font-medium text-neutral-800">GitHub 仓库</dt>
              <dd className="mt-1">
                可以是 <code className="rounded bg-neutral-100 px-1">owner/repo</code>,也可以直接粘贴浏览器里的仓库地址,包括带{" "}
                <code className="rounded bg-neutral-100 px-1">/tree/main/themes/xxx</code> 的页面链接。
                <strong>仓库必须公开</strong>,构建机器用匿名 git clone,读不到私有库。
              </dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-800">子目录(可选)</dt>
              <dd className="mt-1">
                如果整个仓库就是一个主题,留空。如果主题在{" "}
                <code className="rounded bg-neutral-100 px-1">themes/aurora</code> 这种子文件夹里,填那一段路径。
                根目录或该子目录下必须有 <code className="rounded bg-neutral-100 px-1">theme.json</code>。
              </dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-800">分支 / 标签</dt>
              <dd className="mt-1">
                建议填一个固定标签(如 <code className="rounded bg-neutral-100 px-1">v1</code>),不要长期钉在会随便 force-push 的分支上。
                留空时,若 URL 里没有分支信息,会默认尝试 <code className="rounded bg-neutral-100 px-1">v1</code>。
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">导入不会做什么</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
            <li>不会把 zip 或主题文件上传到 GitPress.net。</li>
            <li>不会改你的文章、图片、分类;换主题只改呈现。</li>
            <li>不会在公开网站仓库里留下一份可编辑的主题源码。下次构建会再 clone 一次当时锁定的版本。</li>
            <li>作者以后更新了 GitHub 上的主题,你的站点仍用启用时写下的 ref;要升级,需要改列表里的地址或{" "}
              <code className="rounded bg-neutral-100 px-1">gitpress.json</code> 里的 ref 后重建。</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">常见失败原因</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
            <li>仓库是私有的,或填错了 owner/repo。</li>
            <li>指定的分支/标签不存在,或子目录里没有 <code className="rounded bg-neutral-100 px-1">theme.json</code>。</li>
            <li>
              <code className="rounded bg-neutral-100 px-1">theme.json</code> 的{" "}
              <code className="rounded bg-neutral-100 px-1">specVersion</code> 不是 1,或{" "}
              <code className="rounded bg-neutral-100 px-1">engine</code> 不是{" "}
              <code className="rounded bg-neutral-100 px-1">astro</code>。
            </li>
            <li>主题能读到,但构建时 Astro 报错(缺依赖、路径不符合挂载约定)。那时请看数据仓库的 Actions 日志。</li>
          </ul>
        </section>

        <p className="mt-10 text-sm text-neutral-500">
          还没有主题?可以{" "}
          <Link href="/help/make-theme" className="underline hover:text-neutral-800">
            用 AI 做一份
          </Link>
          ,或先用外观页上的内置主题。规范说明见{" "}
          <a
            href="https://github.com/tap6/gitpress/blob/main/spec/THEME_AUTHORING.md"
            className="underline hover:text-neutral-800"
            target="_blank"
            rel="noreferrer"
          >
            THEME_AUTHORING.md
          </a>
          。
        </p>
    </>
  );
}
