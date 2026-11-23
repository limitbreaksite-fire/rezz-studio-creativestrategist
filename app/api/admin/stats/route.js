import { getAnalytics, listArticles, listMedia, listProjects } from "@/lib/db";
import { json } from "@/lib/api-helpers";

export async function GET() {
  const [articles, projects, media, an] = await Promise.all([listArticles(), listProjects(), listMedia(), getAnalytics(30)]);
  const sum = (arr, k) => arr.reduce((a, x) => a + x[k], 0);
  const views = sum(an.series, "views"), prevViews = sum(an.prev, "views");
  const visitors = sum(an.series, "visitors"), prevVisitors = sum(an.prev, "visitors");
  const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);
  const recent = [
    ...articles.map((a) => ({ id: a.id, kind: "article", title: a.title, status: a.status, date: a.updatedAt, thumb: a.featuredImage, href: `/admin/articles/${a.id}` })),
    ...projects.map((p) => ({ id: p.id, kind: "project", title: p.title, status: p.status, date: p.updatedAt, thumb: p.thumbnail, href: `/admin/portfolio` })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  return json({
    counts: {
      projects: projects.length, projectsPublished: projects.filter((p) => p.status === "published").length,
      articles: articles.length, articlesPublished: articles.filter((a) => a.status === "published").length,
      media: media.length,
    },
    views, visitors, viewsDelta: pct(views, prevViews), visitorsDelta: pct(visitors, prevVisitors),
    series: an.series, recent,
    topArticles: [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map((a) => ({ id: a.id, title: a.title, views: a.views || 0 })),
  });
}
