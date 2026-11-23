import Link from "next/link";
import { notFound } from "next/navigation";
import Art from "@/components/site/Art";
import Icon from "@/components/site/Icon";
import { getArticleBySlug, getSettings, listArticles } from "@/lib/db";
import { excerptFrom, fmtDate, renderArticleHtml } from "@/lib/renderContent";
import { buildArticleSchema } from "@/lib/seo/schema";
import { stripTags, words } from "@/lib/seo/text";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const [a, s] = await Promise.all([getArticleBySlug(slug), getSettings()]);
  if (!a) return { title: "Artikel tidak ditemukan", robots: { index: false } };
  const seo = a.seo || {};
  const title = seo.metaTitle || a.title;
  const description = excerptFrom(a, 170);
  const image = seo.ogImage || a.featuredImage || s.defaultOgImage;
  const canonical = seo.canonical || `/articles/${a.slug}`;
  return {
    title: seo.metaTitle ? { absolute: seo.metaTitle } : a.title,
    description,
    alternates: { canonical },
    robots: seo.noindex || seo.nofollow ? { index: !seo.noindex, follow: !seo.nofollow } : undefined,
    authors: [{ name: a.author || s.authorName }],
    keywords: [seo.focusKeyphrase, ...(seo.secondaryKeyphrases || []), ...(a.tags || [])].filter(Boolean),
    openGraph: {
      type: "article", title: seo.ogTitle || title, description: seo.ogDescription || description, url: canonical,
      publishedTime: a.publishedAt, modifiedTime: a.updatedAt, authors: [a.author || s.authorName], tags: a.tags,
      images: [{ url: image, alt: a.featuredAlt || a.title }],
    },
    twitter: { card: "summary_large_image", title: seo.ogTitle || title, description: seo.ogDescription || description, images: [image] },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const [a, settings, all] = await Promise.all([getArticleBySlug(slug), getSettings(), listArticles({ status: "published" })]);
  if (!a) notFound();
  const { html, toc } = renderArticleHtml(a.content);
  const minutes = Math.max(1, Math.round(words(stripTags(a.content)).length / 200));
  const schema = buildArticleSchema({ article: a, settings, siteUrl: settings.siteUrl });
  const related = all.filter((x) => x.id !== a.id && (x.category === a.category || x.tags?.some((t) => a.tags?.includes(t)))).slice(0, 3);
  const url = `${settings.siteUrl}/articles/${a.slug}`;

  return (
    <article className="page-top section-dark article" itemScope itemType="https://schema.org/BlogPosting">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="container article-wrap">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span><Link href="/articles">Articles</Link><span>/</span><span aria-current="page">{a.title}</span>
        </nav>

        <header className="article-head">
          {a.category && <Link href={`/articles?category=${encodeURIComponent(a.category)}`} className="post-cat">{a.category}</Link>}
          <h1 itemProp="headline">{a.title}</h1>
          {a.excerpt && <p className="article-lead">{a.excerpt}</p>}
          <p className="article-meta">
            <span itemProp="author">{a.author || settings.authorName}</span> · <time dateTime={a.publishedAt} itemProp="datePublished">{fmtDate(a.publishedAt)}</time>
            {a.updatedAt && a.updatedAt.slice(0, 10) !== (a.publishedAt || "").slice(0, 10) && <> · Diperbarui <time dateTime={a.updatedAt} itemProp="dateModified">{fmtDate(a.updatedAt)}</time></>} · {minutes} menit baca
          </p>
        </header>

        {a.featuredImage && (
          <figure className="article-cover">
            <img src={a.featuredImage} alt={a.featuredAlt || a.title} width="1200" height="630" itemProp="image" fetchPriority="high" />
          </figure>
        )}

        <div className="article-grid">
          {toc.length >= 3 && (
            <aside className="toc" aria-label="Daftar isi">
              <b>Daftar isi</b>
              <ol>{toc.map((t) => <li key={t.id} className={`l${t.level}`}><a href={`#${t.id}`}>{t.text}</a></li>)}</ol>
            </aside>
          )}
          <div className="prose" itemProp="articleBody" dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        <footer className="article-foot">
          <div className="share">
            <span>Bagikan</span>
            <a href={`https://wa.me/?text=${encodeURIComponent(a.title + " " + url)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(a.title)}`} target="_blank" rel="noopener noreferrer">X</a>
          </div>
          {a.tags?.length > 0 && <ul className="tags">{a.tags.map((t) => <li key={t}>#{t}</li>)}</ul>}
          <div className="author-box">
            <img src="/brand/logo-mark-white.png" alt="" width="40" height="44" />
            <div><b>{a.author || settings.authorName}</b><p>{settings.tagline}</p></div>
            <a href={`mailto:${settings.email}`} className="btn btn-outline btn-sm">LET’S TALK <Icon name="arrow" size={14} /></a>
          </div>
        </footer>

        {related.length > 0 && (
          <section className="related" aria-label="Artikel terkait">
            <h2>Baca juga</h2>
            <ul className="post-grid">
              {related.map((r) => (
                <li key={r.id}>
                  <Link href={`/articles/${r.slug}`} className="post-card">
                    <Art variant="neon" src={r.featuredImage} alt={r.featuredAlt} className="post-art fill" />
                    <div className="post-body"><span className="post-cat">{r.category || "Article"}</span><h3>{r.title}</h3><p>{excerptFrom(r, 110)}</p></div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
