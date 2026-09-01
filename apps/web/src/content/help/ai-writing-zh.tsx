export function AiWritingZh() {
  return (
    <>
      <p className="mt-4 leading-relaxed text-neutral-500">
        GitPress 不代管模型。你在账号里填自己的 OpenAI 兼容接口,编辑器才能生成初稿和摘要。
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">先配置</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          打开任意站点的设置 → AI 写作,填 Base URL、模型名和 API Key。这份配置跟账号走,对你名下所有站点生效。密钥存在
          GitPress 控制面,加密存放。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">AI 初稿</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
          <li>在可视化编辑器工具栏点「AI 初稿」(源码模式不可用)。</li>
          <li>写下主题或要点,可选语气和篇幅,生成后先看预览。</li>
          <li>「插入光标处」或「替换全文」。这时候还只在编辑器里,点保存才会进仓库。</li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">AI 摘要</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          文章侧栏「摘要」旁可以按当前正文生成一两句说明,写进 frontmatter 的 description。同样要保存后才进仓库。
        </p>
      </section>
    </>
  );
}
