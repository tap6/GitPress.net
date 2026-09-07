import { mediaPreviewUrl } from "./mediaUrl";

const blockToken = (index: number) => `\u0000GPM${index}\u0000`;
const inlineToken = (index: number) => `\u0000GPI${index}\u0000`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    return "&quot;";
  });
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function isSafeHref(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  if (trimmed.startsWith("#")) return true;
  return /^(https?:\/\/|mailto:)/i.test(trimmed);
}

function rewriteSrc(siteId: string, src: string): string | null {
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/media/")) {
    return mediaPreviewUrl(siteId, trimmed.slice("/media/".length));
  }
  if (trimmed.startsWith("media/")) {
    return mediaPreviewUrl(siteId, trimmed.slice("media/".length));
  }
  if (trimmed.startsWith("/api/sites/")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  return null;
}

function splitMarkdownHref(raw: string): string {
  const trimmed = raw.trim();
  const titled = trimmed.match(/^(\S+)(?:\s+"[^"]*")?$/);
  return titled?.[1] ?? trimmed;
}

function findClosingParen(text: string, openIndex: number): number {
  let depth = 1;
  for (let i = openIndex + 1; i < text.length; i += 1) {
    const char = text[i];
    if (char === "(") depth += 1;
    else if (char === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function replaceMdTargets(
  text: string,
  image: boolean,
  replace: (label: string, href: string) => string,
): string {
  const prefix = image ? "![" : "[";
  let out = "";
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf(prefix, i);
    if (start === -1) {
      out += text.slice(i);
      break;
    }
    const labelStart = start + prefix.length;
    const mid = text.indexOf("](", labelStart);
    if (mid === -1) {
      out += text.slice(i, start + 1);
      i = start + 1;
      continue;
    }
    const close = findClosingParen(text, mid + 1);
    if (close === -1) {
      out += text.slice(i, start + 1);
      i = start + 1;
      continue;
    }
    out += text.slice(i, start);
    out += replace(text.slice(labelStart, mid), text.slice(mid + 2, close));
    i = close + 1;
  }
  return out;
}

function renderInline(text: string, siteId: string): string {
  const tokens: string[] = [];
  const stash = (html: string) => {
    const token = inlineToken(tokens.length);
    tokens.push(html);
    return token;
  };

  let out = text.replace(/`([^`]+)`/g, (_, code: string) => stash(`<code>${escapeHtml(code)}</code>`));
  out = replaceMdTargets(out, true, (alt, src) => {
    const resolved = rewriteSrc(siteId, splitMarkdownHref(src));
    if (!resolved) return alt;
    return stash(`<img src="${escapeAttr(resolved)}" alt="${escapeAttr(alt)}" />`);
  });
  out = replaceMdTargets(out, false, (label, href) => {
    const target = splitMarkdownHref(href);
    if (!isSafeHref(target)) return label;
    const resolved = rewriteSrc(siteId, target) ?? target;
    const external = /^https?:\/\//i.test(resolved);
    const rel = external ? ` rel="noreferrer"` : "";
    const blank = external ? ` target="_blank"` : "";
    return stash(`<a href="${escapeAttr(resolved)}"${blank}${rel}>${escapeHtml(label)}</a>`);
  });
  out = escapeHtml(out);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  out = out.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");
  out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  return out.replace(/\u0000GPI(\d+)\u0000/g, (_, index) => tokens[Number(index)] ?? "");
}

function flushParagraph(lines: string[], siteId: string): string {
  const text = lines.join("\n").trim();
  if (!text) return "";
  return `<p>${renderInline(text, siteId).replace(/\n/g, "<br />")}</p>`;
}

function isHr(line: string): boolean {
  return /^(\*\s*){3,}$|^(-\s*){3,}$|^(_{3,})$/.test(line.trim());
}

function listKind(line: string): "ul" | "ol" | null {
  if (/^\s*[-*+]\s+/.test(line)) return "ul";
  if (/^\s*\d+[.)]\s+/.test(line)) return "ol";
  return null;
}

function listItemText(line: string): string {
  return line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "");
}

function renderList(kind: "ul" | "ol", items: string[], siteId: string): string {
  const inner = items.map((item) => `<li>${renderInline(item, siteId)}</li>`).join("");
  return `<${kind}>${inner}</${kind}>`;
}

/**
 * Owner-only Markdown → HTML for the console reading view.
 * Escapes text, allows http(s)/mailto/in-site links, rewrites `/media/` to the
 * authenticated preview proxy, and keeps `<video src="/media/...">`.
 */
export function renderPreviewMarkdown(markdown: string, siteId: string): string {
  const tokens: string[] = [];
  const stash = (html: string) => {
    const token = blockToken(tokens.length);
    tokens.push(html);
    return token;
  };

  let source = markdown.replace(/\r\n?/g, "\n");
  source = source.replace(/```([^\n`]*)\n([\s\S]*?)```/g, (_, lang: string, code: string) => {
    const cls = lang.trim() ? ` class="language-${escapeAttr(lang.trim())}"` : "";
    return stash(`<pre><code${cls}>${escapeHtml(code.replace(/\n$/, ""))}</code></pre>`);
  });
  source = source.replace(/<video\b[\s\S]*?<\/video>/gi, (tag) => {
    const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!src) return "";
    const resolved = rewriteSrc(siteId, src);
    if (!resolved) return "";
    return stash(`<video src="${escapeAttr(resolved)}" controls></video>`);
  });

  const lines = source.split("\n");
  const html: string[] = [];
  let i = 0;
  let paragraph: string[] = [];

  const endParagraph = () => {
    if (paragraph.length === 0) return;
    html.push(flushParagraph(paragraph, siteId));
    paragraph = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      endParagraph();
      i += 1;
      continue;
    }

    if (trimmed.startsWith("\u0000GPM") && trimmed.endsWith("\u0000")) {
      endParagraph();
      html.push(trimmed);
      i += 1;
      continue;
    }

    if (isHr(trimmed)) {
      endParagraph();
      html.push("<hr />");
      i += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      endParagraph();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2], siteId)}</h${level}>`);
      i += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      endParagraph();
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      html.push(`<blockquote>${flushParagraph(quote, siteId)}</blockquote>`);
      continue;
    }

    const kind = listKind(line);
    if (kind) {
      endParagraph();
      const items: string[] = [];
      while (i < lines.length && listKind(lines[i]) === kind) {
        items.push(listItemText(lines[i]));
        i += 1;
      }
      html.push(renderList(kind, items, siteId));
      continue;
    }

    paragraph.push(line);
    i += 1;
  }
  endParagraph();

  return html
    .join("\n")
    .replace(/\u0000GPM(\d+)\u0000/g, (_, index) => tokens[Number(index)] ?? "");
}
