// Generator JSON-LD: Article/BlogPosting + BreadcrumbList + FAQPage (otomatis dari heading berbentuk pertanyaan).
import { extractFaq, stripTags, words } from "./text.js";

const abs = (base, p) => (!p ? undefined : /^https?:\/\//i.test(p) ? p : `${base.replace(/\/$/, "")}${p.startsWith("/") ? "" : "/"}${p}`);

export function buildArticleSchema({ article, settings, siteUrl }) {
  const base = (siteUrl || settings?.siteUrl || "").replace(/\/$/, "");
  const url = `${base}/articles/${article.slug}`;
  const seo = article.seo || {};
  const type = seo.schemaType || "BlogPosting";
  const image = abs(base, seo.ogImage || article.featuredImage || settings?.defaultOgImage);
  const description = seo.metaDescription || article.excerpt || stripTags(article.content).slice(0, 160);
  const wc = words(stripTags(article.content)).length;

  const graph = [
    {
      "@type": type,
      "@id": `${url}#article`,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      headline: (seo.metaTitle || article.title || "").slice(0, 110),
      description,
      image: image ? [image] : undefined,
      datePublished: article.publishedAt || undefined,
      dateModified: article.updatedAt || article.publishedAt || undefined,
      author: { "@type": "Person", name: article.author || settings?.authorName || "Rezz", url: settings?.authorUrl || base },
      publisher: { "@type": "Organization", name: settings?.siteName || "Rezz", logo: { "@type": "ImageObject", url: abs(base, "/brand/logo-mark-white.png") } },
      articleSection: article.category || undefined,
      keywords: [seo.focusKeyphrase, ...(seo.secondaryKeyphrases || []), ...(article.tags || [])].filter(Boolean).join(", ") || undefined,
      wordCount: wc,
      inLanguage: settings?.language || "id",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base || "/" },
        { "@type": "ListItem", position: 2, name: "Articles", item: `${base}/articles` },
        { "@type": "ListItem", position: 3, name: article.title, item: url },
      ],
    },
  ];
  const faq = extractFaq(article.content);
  if (faq.length >= 2) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    });
  }
  return JSON.parse(JSON.stringify({ "@context": "https://schema.org", "@graph": graph }));
}
