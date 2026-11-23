import { getSettings, listArticles } from "@/lib/db";
import { excerptFrom } from "@/lib/renderContent";

export const dynamic = "force-dynamic";

const esc = (s) => String(s ?? "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

export async function GET() {
  const [s, articles] = await Promise.all([getSettings(), listArticles({ status: "published" })]);
  const base = s.siteUrl.replace(/\/$/, "");
  const items = articles.slice(0, 30).map((a) => `
    <item>
      <title>${esc(a.title)}</title>
      <link>${base}/articles/${a.slug}</link>
      <guid isPermaLink="true">${base}/articles/${a.slug}</guid>
      <pubDate>${new Date(a.publishedAt || a.updatedAt).toUTCString()}</pubDate>
      <description>${esc(excerptFrom(a, 300))}</description>
      ${a.category ? `<category>${esc(a.category)}</category>` : ""}
    </item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
  <title>${esc(s.siteName)} — Articles</title><link>${base}/articles</link>
  <description>${esc(s.defaultMetaDescription)}</description><language>${s.language}</language>
  <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>${items}
</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" } });
}
