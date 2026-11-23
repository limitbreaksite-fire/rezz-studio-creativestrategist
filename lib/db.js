// Penyimpanan berbasis file JSON (tanpa database eksternal). Cocok untuk VPS / Docker dengan volume persisten.
// Untuk Vercel/serverless, ganti isi file ini dengan adapter database (Postgres/Supabase/Turso) — antarmuka fungsinya tetap sama.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { slugify } from "./seo/text.js";

export const DATA_DIR = path.resolve(process.env.DATA_DIR || "./data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const locks = new Map();
function withLock(name, fn) {
  const prev = locks.get(name) || Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(name, next.catch(() => {}));
  return next;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

async function readJson(name, fallback) {
  await ensureDir();
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") {
      const seed = typeof fallback === "function" ? fallback() : fallback;
      await writeJson(name, seed);
      return seed;
    }
    throw e;
  }
}

async function writeJson(name, data) {
  await ensureDir();
  const file = path.join(DATA_DIR, `${name}.json`);
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

/* ------------------------------ Settings ------------------------------ */
export const DEFAULT_SETTINGS = {
  siteName: "Rezz",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://rezz.studio",
  tagline: "Video Editor · Motion · Visual Storytelling",
  metaTitleTemplate: "%title% | Rezz",
  defaultMetaDescription:
    "Rezz is a video editor and motion designer based in Indonesia — editing stories, not just footage. Available for remote work.",
  authorName: "Rezz",
  authorUrl: "",
  location: "Indonesia",
  email: "hello@rezz.studio",
  social: { linkedin: "", instagram: "", youtube: "", tiktok: "" },
  images: { heroPortrait: "", aboutHero: "", ogImage: "" },
  defaultOgImage: "/og-default.png",
  language: "id",
};

export async function getSettings() {
  const s = await readJson("settings", DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...s, social: { ...DEFAULT_SETTINGS.social, ...(s.social || {}) }, images: { ...DEFAULT_SETTINGS.images, ...(s.images || {}) } };
}
export async function saveSettings(patch) {
  return withLock("settings", async () => {
    const cur = await getSettings();
    const next = { ...cur, ...patch, social: { ...cur.social, ...(patch.social || {}) }, images: { ...cur.images, ...(patch.images || {}) } };
    await writeJson("settings", next);
    return next;
  });
}

/* ------------------------------ Articles ------------------------------ */
const seedArticles = () => [
  {
    id: uid(),
    title: "Cara Membuat Transisi Halus di Premiere Pro",
    slug: "cara-membuat-transisi-halus-di-premiere-pro",
    excerpt: "Panduan praktis membuat transisi yang terasa natural di Premiere Pro tanpa plugin tambahan.",
    content:
      "<p>Transisi halus di Premiere Pro dimulai dari ritme potongan, bukan dari efek. Di artikel ini gue bahas cara membuat transisi halus yang terasa natural, dari match cut sampai transisi suara.</p>" +
      "<h2>Kenapa transisi halus penting?</h2><p>Penonton jarang sadar pada transisi yang bagus, tapi mereka langsung merasakan transisi yang kasar. Transisi halus menjaga perhatian tetap mengalir dari satu adegan ke adegan berikutnya.</p>" +
      "<h2>Langkah membuat transisi halus di Premiere Pro</h2><ol><li>Pilih titik potong di gerakan yang sama.</li><li>Tumpuk audio sebelum visual berganti (J-cut).</li><li>Tambahkan motion blur ringan lewat adjustment layer.</li></ol>" +
      "<h3>Perbandingan teknik transisi</h3><table><thead><tr><th>Teknik</th><th>Tingkat kesulitan</th><th>Cocok untuk</th></tr></thead><tbody><tr><td>Match cut</td><td>Menengah</td><td>Cinematic</td></tr><tr><td>J-cut / L-cut</td><td>Mudah</td><td>Dialog &amp; vlog</td></tr><tr><td>Whip pan</td><td>Menengah</td><td>Sport &amp; action</td></tr></tbody></table><hr>" +
      "<h2>Pertanyaan umum</h2><h3>Apakah perlu plugin transisi?</h3><p>Tidak. Sebagian besar transisi halus bisa dibuat dengan fitur bawaan Premiere Pro dan timing yang tepat.</p>",
    status: "published",
    category: "Editing Tips",
    tags: ["premiere pro", "transisi", "video editing"],
    featuredImage: "",
    featuredAlt: "Timeline Premiere Pro dengan transisi halus",
    author: "Rezz",
    seo: {
      focusKeyphrase: "transisi halus premiere pro",
      secondaryKeyphrases: ["match cut", "j-cut"],
      metaTitle: "Cara Membuat Transisi Halus di Premiere Pro (Tanpa Plugin)",
      metaDescription:
        "Pelajari cara membuat transisi halus di Premiere Pro: match cut, J-cut, dan motion blur. Panduan langkah demi langkah untuk editor pemula hingga mahir.",
      canonical: "",
      noindex: false,
      nofollow: false,
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      schemaType: "BlogPosting",
    },
    views: 0,
    createdAt: now(),
    updatedAt: now(),
    publishedAt: now(),
  },
  {
    id: uid(),
    title: "Color Grading 101: Mood & Atmosphere",
    slug: "color-grading-101-mood-atmosphere",
    excerpt: "Dasar color grading untuk membangun mood.",
    content: "<p>Draft: dasar color grading untuk membangun mood dan atmosfer visual.</p><h2>Mulai dari white balance</h2><p>Tulis isi artikel di sini.</p>",
    status: "draft",
    category: "Editing Tips",
    tags: ["color grading"],
    featuredImage: "",
    featuredAlt: "",
    author: "Rezz",
    seo: { focusKeyphrase: "", secondaryKeyphrases: [], metaTitle: "", metaDescription: "", canonical: "", noindex: false, nofollow: false, ogTitle: "", ogDescription: "", ogImage: "", schemaType: "BlogPosting" },
    views: 0,
    createdAt: now(),
    updatedAt: now(),
    publishedAt: null,
  },
];

export async function listArticles({ status } = {}) {
  const all = await readJson("articles", seedArticles);
  const list = status ? all.filter((a) => a.status === status) : all;
  return list.sort((a, b) => new Date(b.publishedAt || b.updatedAt) - new Date(a.publishedAt || a.updatedAt));
}
export async function getArticle(id) {
  return (await listArticles()).find((a) => a.id === id) || null;
}
export async function getArticleBySlug(slug, { onlyPublished = true } = {}) {
  const a = (await listArticles()).find((x) => x.slug === slug);
  if (!a) return null;
  if (onlyPublished && a.status !== "published") return null;
  return a;
}

async function uniqueSlug(all, base, selfId) {
  let slug = slugify(base) || "artikel";
  let i = 2;
  while (all.some((a) => a.slug === slug && a.id !== selfId)) slug = `${slugify(base)}-${i++}`;
  return slug;
}

export async function saveArticle(input) {
  return withLock("articles", async () => {
    const all = await readJson("articles", seedArticles);
    const existing = input.id ? all.find((a) => a.id === input.id) : null;
    const base = existing || {
      id: uid(), views: 0, createdAt: now(), publishedAt: null,
      seo: {}, tags: [], status: "draft",
    };
    const merged = { ...base, ...input, seo: { ...(base.seo || {}), ...(input.seo || {}) } };
    merged.slug = await uniqueSlug(all, input.slug || merged.slug || merged.title, merged.id);
    merged.updatedAt = now();
    if (merged.status === "published" && !merged.publishedAt) merged.publishedAt = now();
    if (merged.status !== "published" && input.status === "draft") merged.publishedAt = base.publishedAt; // tetap simpan tanggal publish pertama
    const idx = all.findIndex((a) => a.id === merged.id);
    if (idx >= 0) all[idx] = merged; else all.push(merged);
    await writeJson("articles", all);
    return merged;
  });
}
export async function deleteArticle(id) {
  return withLock("articles", async () => {
    const all = await readJson("articles", seedArticles);
    await writeJson("articles", all.filter((a) => a.id !== id));
  });
}
export async function bumpArticleViews(slug) {
  return withLock("articles", async () => {
    const all = await readJson("articles", seedArticles);
    const a = all.find((x) => x.slug === slug);
    if (a) { a.views = (a.views || 0) + 1; await writeJson("articles", all); }
  });
}

/* ------------------------------ Projects ------------------------------ */
const seedProjects = () => {
  const mk = (i, title, category, subtitle, art) => ({
    id: uid(), title, slug: slugify(title), category, subtitle, art,
    videoUrl: "", thumbnail: "", description: "", tags: [category.toLowerCase()],
    status: "published", order: i, featuredOnHome: true, createdAt: now(), updatedAt: now(),
  });
  return [
    mk(1, "Entertainment", "Entertainment", "High Energy", "neon"),
    mk(2, "Sport / Action", "Sport / Action", "Motion / Adrenaline", "motion"),
    mk(3, "Cinematic", "Cinematic", "Atmosphere", "temple"),
    mk(4, "Dramatic", "Dramatic", "Story / Emotion", "drama"),
    mk(5, "Fun / Lifestyle", "Fun / Lifestyle", "Social / Lifestyle", "fun"),
    mk(6, "Travel", "Travel", "Experience", "travel"),
    { ...mk(7, "For Persona — Hospitality Edit", "Lifestyle / Hospitality", "A speculative edit for Persona", "persona"), featuredOnHome: false, isPersona: true },
  ];
};
export async function listProjects({ status } = {}) {
  const all = await readJson("projects", seedProjects);
  const list = status ? all.filter((p) => p.status === status) : all;
  return list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}
export async function getProject(id) { return (await listProjects()).find((p) => p.id === id) || null; }
export async function saveProject(input) {
  return withLock("projects", async () => {
    const all = await readJson("projects", seedProjects);
    const existing = input.id ? all.find((p) => p.id === input.id) : null;
    const base = existing || { id: uid(), createdAt: now(), order: all.length + 1, status: "draft", tags: [], art: "neon" };
    const merged = { ...base, ...input, updatedAt: now() };
    merged.slug = slugify(input.slug || merged.slug || merged.title) || merged.id;
    const idx = all.findIndex((p) => p.id === merged.id);
    if (idx >= 0) all[idx] = merged; else all.push(merged);
    await writeJson("projects", all);
    return merged;
  });
}
export async function deleteProject(id) {
  return withLock("projects", async () => {
    const all = await readJson("projects", seedProjects);
    await writeJson("projects", all.filter((p) => p.id !== id));
  });
}

/* -------------------------------- Media -------------------------------- */
export async function listMedia() {
  return (await readJson("media", [])).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
export async function addMedia(item) {
  return withLock("media", async () => {
    const all = await readJson("media", []);
    const rec = { id: uid(), alt: "", createdAt: now(), ...item };
    all.push(rec);
    await writeJson("media", all);
    return rec;
  });
}
export async function updateMedia(id, patch) {
  return withLock("media", async () => {
    const all = await readJson("media", []);
    const m = all.find((x) => x.id === id);
    if (!m) return null;
    Object.assign(m, patch);
    await writeJson("media", all);
    return m;
  });
}
export async function deleteMedia(id) {
  return withLock("media", async () => {
    const all = await readJson("media", []);
    const m = all.find((x) => x.id === id);
    if (m?.file) { try { await fs.unlink(path.join(UPLOAD_DIR, m.file)); } catch {} }
    await writeJson("media", all.filter((x) => x.id !== id));
  });
}

/* ------------------------------ Analytics ------------------------------ */
export async function trackView(pathname, visitorHash) {
  return withLock("analytics", async () => {
    const a = await readJson("analytics", { days: {} });
    const day = new Date().toISOString().slice(0, 10);
    const d = (a.days[day] ||= { views: 0, visitors: [], paths: {} });
    d.views += 1;
    d.paths[pathname] = (d.paths[pathname] || 0) + 1;
    if (visitorHash && !d.visitors.includes(visitorHash) && d.visitors.length < 20000) d.visitors.push(visitorHash);
    // simpan 120 hari terakhir saja
    const keys = Object.keys(a.days).sort();
    while (keys.length > 120) delete a.days[keys.shift()];
    await writeJson("analytics", a);
  });
}
export async function getAnalytics(days = 30) {
  const a = await readJson("analytics", { days: {} });
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const d = a.days[dt];
    out.push({ date: dt, views: d?.views || 0, visitors: d?.visitors?.length || 0 });
  }
  const prevOut = [];
  for (let i = days * 2 - 1; i >= days; i--) {
    const dt = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const d = a.days[dt];
    prevOut.push({ views: d?.views || 0, visitors: d?.visitors?.length || 0 });
  }
  return { series: out, prev: prevOut };
}
