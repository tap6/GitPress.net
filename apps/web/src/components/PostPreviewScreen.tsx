import { Link } from "@/i18n/navigation";
import { previewAssetSrc } from "@/lib/postPreview";
import { formatPreviewDate, type PostPreviewChrome } from "@/lib/postPreviewChrome";
import { renderPreviewMarkdown } from "@/lib/previewMarkdown";

export interface PostPreviewPost {
  title: string;
  date: string | null;
  draft: boolean;
  tags: string[];
  category: string | null;
  description: string;
  slug: string;
  body: string;
}

interface BarProps {
  draft: boolean;
  editHref: string;
  backHref: string;
  publicHref: string | null;
  labels: {
    draftBadge: string;
    liveBadge: string;
    disclaimer: string;
    goEdit: string;
    back: string;
    openPublic: string;
  };
}

export function PostPreviewBar({ draft, editHref, backHref, publicHref, labels }: BarProps) {
  return (
    <div className="sticky top-0 z-20 border-b border-black/20 bg-wp-base text-[13px] text-wp-sidebar-text">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
        <p className="min-w-0 leading-snug">
          <span className="font-medium text-white">{draft ? labels.draftBadge : labels.liveBadge}</span>
          <span className="mt-0.5 block text-[12px] text-neutral-400 sm:mt-0 sm:ml-2 sm:inline">
            {labels.disclaimer}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href={editHref} className="text-[#72aee6] hover:text-white hover:underline">
            {labels.goEdit}
          </Link>
          {publicHref && (
            <a
              href={publicHref}
              target="_blank"
              rel="noreferrer"
              className="text-[#72aee6] hover:text-white hover:underline"
            >
              {labels.openPublic}
            </a>
          )}
          <Link href={backHref} className="hover:text-white hover:underline">
            {labels.back}
          </Link>
        </div>
      </div>
    </div>
  );
}

interface ViewProps {
  siteId: string;
  post: PostPreviewPost;
  chrome: PostPreviewChrome;
}

export function PostPreviewView({ siteId, post, chrome }: ViewProps) {
  const logoSrc = previewAssetSrc(siteId, chrome.logo);
  const avatarSrc = previewAssetSrc(siteId, chrome.avatar);
  const html = renderPreviewMarkdown(post.body, siteId);
  const when = formatPreviewDate(post.date, chrome.language);
  const category = chrome.categoryLabel(post.category);

  return (
    <div className="gp-preview min-h-full bg-[#f7f4ef] text-stone-900" lang={chrome.language}>
      <header className="border-b border-stone-200/80 bg-[#fbf8f3]">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-8 sm:px-6">
          <div className="flex items-center gap-3">
            {avatarSrc && (
              <img
                src={avatarSrc}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <div className="min-w-0">
              {logoSrc && (
                <img src={logoSrc} alt="" className="mb-1 max-h-10 w-auto max-w-[12rem] object-contain" />
              )}
              <p className="text-xl font-semibold tracking-tight">{chrome.title}</p>
            </div>
          </div>
          {chrome.description && (
            <p className="text-sm leading-relaxed text-stone-500">{chrome.description}</p>
          )}
          {chrome.nav.length > 0 && (
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
              {chrome.nav.map((item, index) =>
                item.href ? (
                  <a
                    key={`${item.label}-${index}`}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-stone-900 hover:underline"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span key={`${item.label}-${index}`}>{item.label}</span>
                ),
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        <article>
          <header className="mb-8">
            {(when || category) && (
              <p className="text-sm text-stone-500">
                {[when, category].filter(Boolean).join(" · ")}
              </p>
            )}
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              {post.title}
            </h1>
            {post.description && (
              <p className="mt-3 text-base leading-relaxed text-stone-500">{post.description}</p>
            )}
          </header>
          {html ? (
            <div className="gp-preview-prose" dangerouslySetInnerHTML={{ __html: html }} />
          ) : null}
          {post.tags.length > 0 && (
            <p className="mt-10 flex flex-wrap gap-2 text-sm text-stone-500">
              {post.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </p>
          )}
        </article>
      </main>

      {chrome.footer.length > 0 && (
        <footer className="border-t border-stone-200/80 bg-[#fbf8f3]">
          <ul className="mx-auto flex max-w-3xl flex-wrap gap-x-4 gap-y-1 px-5 py-6 text-xs text-stone-500 sm:px-6">
            {chrome.footer.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                {item.href ? (
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer" : undefined}
                    className="hover:text-stone-800 hover:underline"
                  >
                    {item.label}
                  </a>
                ) : (
                  item.label
                )}
              </li>
            ))}
          </ul>
        </footer>
      )}
    </div>
  );
}
