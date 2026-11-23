import Link from "next/link";
import Art from "@/components/site/Art";
import { getSettings, listArticles } from "@/lib/db";
import { excerptFrom, fmtDate } from "@/lib/renderContent";
import { stripTags, words } from "@/lib/seo/text";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Articles — Tips, Workflow & Visual Storytelling",
  description: "Artikel tentang video editing, motion, color grading, workflow, dan visual storytelling dari Rezz.",
  alternates: { canonical: "/articles", types: { "application/rss+xml": "/feed.xml" } },
};

export default async function ArticlesPage({ searchParams }) {
  const sp = await searchParams;
  const cat = typeof sp?.category === "string" ? sp.category : "";
  const [all, settings] = await Promise.all([listArticles({ status: "published" }), getSettings()]);
  const cats = [...new Set(all.map((a) => a.category).filter(Boolean))];
  const list = cat ? all.filter((a) => a.category === cat) : all;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Blog", name: `${settings.siteName} — Articles`, url: `${settings.siteUrl}/articles`,
    blogPost: all.slice(0, 20).map((a) => ({ "@type": "BlogPosting", headline: a.title, url: `${settings.siteUrl}/articles/${a.slug}`, datePublished: a.publishedAt })),
  };
  return (
    <section className="page-top section-dark">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container">
        <div className="section-head stack">
          <h1 className="page-title">ARTICLES</h1>
          <p className="section-sub">Catatan tentang editing, motion, dan bercerita lewat visual.</p>
        </div>
        {cats.length > 0 && (
          <ul className="chips" aria-label="Kategori">
            <li><Link href="/articles" className={!cat ? "active" : ""}>Semua</Link></li>
            {cats.map((c) => <li key={c}><Link href={`/articles?category=${encodeURIComponent(c)}`} className={cat === c ? "active" : ""}>{c}</Link></li>)}
          </ul>
        )}
        {list.length === 0 ? <p className="empty">Belum ada artikel.</p> : (
          <ul className="post-grid" data-stagger="0.08">
            {list.map((a) => (
              <li key={a.id}>
                <Link href={`/articles/${a.slug}`} className="post-card">
                  <Art variant="neon" src={a.featuredImage} alt={a.featuredAlt} className="post-art fill" />
                  <div className="post-body">
                    <span className="post-cat">{a.category || "Article"}</span>
                    <h2>{a.title}</h2>
                    <p>{excerptFrom(a, 140)}</p>
                    <span className="post-meta">{fmtDate(a.publishedAt)} · {Math.max(1, Math.round(words(stripTags(a.content)).length / 200))} menit baca</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
