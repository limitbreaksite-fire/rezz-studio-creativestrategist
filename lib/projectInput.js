import { str, strList } from "./api-helpers.js";

export const cleanProject = (b) => ({
  ...(b.id ? { id: String(b.id) } : {}),
  title: str(b.title, 160), slug: str(b.slug, 120), category: str(b.category, 80), subtitle: str(b.subtitle, 160),
  description: str(b.description, 2000), videoUrl: str(b.videoUrl, 500), thumbnail: str(b.thumbnail, 500),
  art: ["neon", "motion", "temple", "drama", "fun", "travel", "persona"].includes(b.art) ? b.art : "neon",
  tags: strList(b.tags), status: b.status === "published" ? "published" : "draft",
  featuredOnHome: !!b.featuredOnHome, isPersona: !!b.isPersona, order: Number.isFinite(+b.order) ? +b.order : 99,
});
