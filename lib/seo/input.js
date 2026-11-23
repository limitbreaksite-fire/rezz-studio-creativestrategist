// Memetakan objek artikel → input analyzer (dipakai server & editor).
export function toAnalysisInput(a, settings = {}, others = []) {
  const seo = a.seo || {};
  return {
    title: a.title || "", slug: a.slug || "", content: a.content || "", excerpt: a.excerpt || "",
    focus: seo.focusKeyphrase || "", secondary: seo.secondaryKeyphrases || [],
    metaTitle: seo.metaTitle || "", metaDescription: seo.metaDescription || "", canonical: seo.canonical || "",
    featuredImage: a.featuredImage || "", featuredAlt: a.featuredAlt || "", ogImage: seo.ogImage || "",
    noindex: !!seo.noindex, author: a.author || settings.authorName || "", publishedAt: a.publishedAt || null, updatedAt: a.updatedAt || null,
    siteName: settings.siteName || "", siteUrl: settings.siteUrl || "", defaultOgImage: settings.defaultOgImage || "",
    lang: "auto", currentId: a.id || null,
    others: others.filter((x) => x.id !== a.id).map((x) => ({ id: x.id, title: x.title, slug: x.slug, status: x.status, tags: x.tags, focus: x.seo?.focusKeyphrase || "" })),
  };
}
