// Utilitas teks & parsing HTML ringan (tanpa DOM) — jalan di server, browser, dan Node test.
import { STOPWORDS } from "./lang.js";

export const stripDiacritics = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "");

export function slugify(s) {
  return stripDiacritics(String(s || "").toLowerCase())
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
}

const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };
export function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);
}

export function stripTags(html) {
  return decodeEntities(
    String(html || "")
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<(br|hr)\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|pre|figure|figcaption|table|ul|ol)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export const words = (text) => String(text || "").match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || [];

export function sentences(text) {
  return String(text || "")
    .split(/(?<=[.!?…])\s+(?=[\p{Lu}\p{N}"“(\[])|\n+/u)
    .map((s) => s.trim())
    .filter((s) => words(s).length > 0);
}

export function countSyllables(word, lang = "en") {
  const w = stripDiacritics(word.toLowerCase()).replace(/[^a-z]/g, "");
  if (!w) return 0;
  let groups = (w.match(/[aeiouy]+/g) || []).length;
  if (lang === "en" && /e$/.test(w) && !/le$/.test(w) && groups > 1) groups -= 1;
  return Math.max(1, groups);
}

/* --------------------------- stemming ringan --------------------------- */
const ID_PREFIX = ["meng", "meny", "peng", "peny", "mem", "men", "pem", "pen", "ber", "ter", "per", "me", "pe", "di", "ke", "se"];
const ID_SUFFIX = ["kannya", "annya", "kan", "an", "i", "nya", "lah", "kah", "pun"];

export function stem(word, lang = "en") {
  let w = stripDiacritics(String(word).toLowerCase()).replace(/['’]/g, "");
  if (lang === "id") {
    if (w.length > 5) for (const p of ID_PREFIX) if (w.startsWith(p) && w.length - p.length >= 4) { w = w.slice(p.length); break; }
    if (w.length > 5) for (const s of ID_SUFFIX) if (w.endsWith(s) && w.length - s.length >= 4) { w = w.slice(0, -s.length); break; }
    return w;
  }
  if (w.length > 4) {
    if (w.endsWith("ies")) return w.slice(0, -3) + "y";
    if (/(ss|us|is)$/.test(w)) return w;
    if (/(ches|shes|xes|zes|sses)$/.test(w)) return w.slice(0, -2);
    if (w.endsWith("s")) w = w.slice(0, -1);
  }
  if (w.length > 6 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 5 && w.endsWith("ed")) w = w.slice(0, -2);
  if (w.length > 5 && w.endsWith("ly")) w = w.slice(0, -2);
  return w;
}

export function detectLang(text) {
  const ws = words(text).slice(0, 500).map((w) => w.toLowerCase());
  let id = 0, en = 0;
  for (const w of ws) { if (STOPWORDS.id.has(w)) id++; if (STOPWORDS.en.has(w)) en++; }
  return id >= en ? "id" : "en";
}

/* --------------------------- lebar piksel SERP --------------------------- */
const ARIAL = {
  " ": 278, "!": 278, '"': 355, "#": 556, $: 556, "%": 889, "&": 667, "'": 191, "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333, ".": 278, "/": 278,
  ":": 278, ";": 278, "<": 584, "=": 584, ">": 584, "?": 556, "@": 1015,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
  "|": 260, "–": 556, "—": 1000, "’": 222, "“": 333, "”": 333, "·": 278, "…": 1000,
};
export function pixelWidth(str, px = 20) {
  let w = 0;
  for (const ch of String(str)) w += ARIAL[ch] ?? (/\d/.test(ch) ? 556 : 556);
  return Math.round((w / 1000) * px);
}

/* ------------------------------ parsing HTML ------------------------------ */
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decodeEntities(m[1] ?? m[2] ?? m[3] ?? "") : null;
};

export function extractStructure(html, siteUrl = "") {
  const src = String(html || "");
  let host = "";
  try { host = new URL(siteUrl).hostname.replace(/^www\./, ""); } catch {}

  const headings = [];
  const headRe = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = headRe.exec(src))) headings.push({ level: +m[1], text: stripTags(m[2]).replace(/\n/g, " ").trim(), index: m.index, end: headRe.lastIndex });

  const paragraphs = [];
  const pRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  while ((m = pRe.exec(src))) {
    const t = stripTags(m[1]).replace(/\n/g, " ").trim();
    if (t) paragraphs.push({ text: t, index: m.index });
  }

  const images = [];
  const imgRe = /<img\b[^>]*>/gi;
  while ((m = imgRe.exec(src))) images.push({ src: attr(m[0], "src") || "", alt: (attr(m[0], "alt") || "").trim(), index: m.index });

  const links = [];
  const aRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  while ((m = aRe.exec(src))) {
    const href = attr(m[1], "href") || "";
    if (!href || href.startsWith("#") || /^(mailto:|tel:)/i.test(href)) continue;
    let internal = href.startsWith("/");
    if (!internal) {
      try { internal = !!host && new URL(href).hostname.replace(/^www\./, "") === host; } catch { internal = true; }
    }
    const rel = attr(m[1], "rel") || "";
    links.push({ href, text: stripTags(m[2]).trim(), internal, nofollow: /nofollow|sponsored|ugc/i.test(rel), newTab: attr(m[1], "target") === "_blank" });
  }

  const count = (re) => (src.match(re) || []).length;
  const counts = {
    lists: count(/<(ul|ol)\b/gi),
    listItems: count(/<li\b/gi),
    tables: count(/<table\b/gi),
    videos: count(/<video\b/gi) + count(/<iframe\b[^>]*(youtube|vimeo)/gi),
    hr: count(/<hr\b/gi),
    blockquotes: count(/<blockquote\b/gi),
    code: count(/<pre\b/gi),
  };

  // seksi: konten antar heading
  const sections = [];
  let cursor = 0, current = { heading: null, from: 0 };
  for (const h of headings) {
    sections.push({ heading: current.heading, html: src.slice(cursor, h.index) });
    current = { heading: h }; cursor = h.end;
  }
  sections.push({ heading: current.heading, html: src.slice(cursor) });
  for (const s of sections) { s.text = stripTags(s.html); s.words = words(s.text).length; }

  // teks isi (tanpa heading/tabel/kode) untuk keterbacaan
  const body = stripTags(src.replace(/<(h[1-6]|table|pre|figcaption)\b[\s\S]*?<\/\1>/gi, " "));
  const fullText = stripTags(src);
  return { headings, paragraphs, images, links, counts, sections, bodyText: body, text: fullText, html: src };
}

export function extractFaq(html) {
  const { sections } = extractStructure(html);
  const faq = [];
  for (const s of sections) {
    if (s.heading && /\?\s*$/.test(s.heading.text) && s.heading.level >= 2 && s.text.trim()) {
      faq.push({ question: s.heading.text, answer: s.text.replace(/\n+/g, " ").trim() });
    }
  }
  return faq;
}

export function buildToc(html) {
  const { headings } = extractStructure(html);
  const used = new Map();
  return headings
    .filter((h) => h.level >= 2 && h.level <= 4 && h.text)
    .map((h) => {
      let id = slugify(h.text) || "bagian";
      const n = used.get(id) || 0; used.set(id, n + 1);
      if (n) id = `${id}-${n + 1}`;
      return { level: h.level, text: h.text, id };
    });
}
