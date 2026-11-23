import { sanitizeHtml } from "./sanitize.js";
import { str, strList } from "./api-helpers.js";

// Whitelist & sanitasi field artikel dari klien sebelum disimpan.
export function cleanArticleInput(b) {
  const seo = b.seo || {};
  const out = {
    title: str(b.title, 200),
    slug: str(b.slug, 120),
    excerpt: str(b.excerpt, 400),
    content: sanitizeHtml(String(b.content || "").slice(0, 2_000_000)),
    status: ["draft", "published"].includes(b.status) ? b.status : "draft",
    category: str(b.category, 80),
    tags: strList(b.tags),
    featuredImage: str(b.featuredImage, 500),
    featuredAlt: str(b.featuredAlt, 200),
    author: str(b.author, 80),
    seo: {
      focusKeyphrase: str(seo.focusKeyphrase, 120),
      secondaryKeyphrases: strList(seo.secondaryKeyphrases, 5, 120),
      metaTitle: str(seo.metaTitle, 120),
      metaDescription: str(seo.metaDescription, 320),
      canonical: str(seo.canonical, 500),
      noindex: !!seo.noindex,
      nofollow: !!seo.nofollow,
      ogTitle: str(seo.ogTitle, 120),
      ogDescription: str(seo.ogDescription, 320),
      ogImage: str(seo.ogImage, 500),
      schemaType: ["BlogPosting", "Article", "NewsArticle", "TechArticle"].includes(seo.schemaType) ? seo.schemaType : "BlogPosting",
    },
  };
  if (b.id) out.id = String(b.id);
  if (!b.slug) delete out.slug;
  return out;
}
