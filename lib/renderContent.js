// Render konten artikel untuk halaman publik: sanitasi, H1→H2, id heading (untuk TOC), lazy image, tabel scrollable.
import { sanitizeHtml } from "./sanitize.js";
import { buildToc, slugify, stripTags } from "./seo/text.js";

export function renderArticleHtml(html) {
  let out = sanitizeHtml(html || "");
  out = out.replace(/<(\/?)h1(\b[^>]*)>/gi, "<$1h2$2>"); // judul artikel sudah H1
  const toc = buildToc(out);
  let i = 0;
  out = out.replace(/<h([2-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (m, lvl, inner) => {
    const text = stripTags(inner).replace(/\n/g, " ").trim();
    const entry = toc[i];
    if (entry && entry.text === text) { i++; return `<h${lvl} id="${entry.id}">${inner}</h${lvl}>`; }
    return `<h${lvl}>${inner}</h${lvl}>`;
  });
  out = out
    .replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async"')
    .replace(/<table\b/gi, '<div class="table-wrap"><table')
    .replace(/<\/table>/gi, "</table></div>");
  return { html: out, toc };
}

export function excerptFrom(article, n = 160) {
  const t = article.seo?.metaDescription || article.excerpt || stripTags(article.content || "").replace(/\n/g, " ");
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
}

export const fmtDate = (d, locale = "id-ID") =>
  d ? new Date(d).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) : "";

export { slugify };
