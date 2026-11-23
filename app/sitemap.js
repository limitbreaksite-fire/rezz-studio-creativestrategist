import { getSettings, listArticles } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const [s, articles] = await Promise.all([getSettings(), listArticles({ status: "published" })]);
  const base = s.siteUrl.replace(/\/$/, "");
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/work`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${base}/articles`, lastModified: articles[0] ? new Date(articles[0].updatedAt) : now, changeFrequency: "weekly", priority: 0.8 },
    ...articles.filter((a) => !a.seo?.noindex).map((a) => ({
      url: `${base}/articles/${a.slug}`, lastModified: new Date(a.updatedAt), changeFrequency: "monthly", priority: 0.7,
    })),
  ];
}
