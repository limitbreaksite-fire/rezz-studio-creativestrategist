// Mesin analisis SEO + keterbacaan + teknis + GEO (AI search) — murni JavaScript, tanpa dependensi.
import {
  extractStructure, extractFaq, buildToc, words, sentences, stem, stripDiacritics,
  countSyllables, detectLang, pixelWidth,
} from "./text.js";
import {
  STOPWORDS, TRANSITIONS, QUESTION_WORDS, BAD_LINK_TEXTS, EN_IRREGULAR_PARTICIPLES, GENERIC_SLUG_WORDS,
} from "./lang.js";

const VAL = { good: 1, ok: 0.5, bad: 0 };
export const GROUPS = {
  seo: { label: "SEO", weight: 0.4 },
  readability: { label: "Keterbacaan", weight: 0.2 },
  technical: { label: "Teknis", weight: 0.15 },
  geo: { label: "GEO / AI Search", weight: 0.25 },
};

export const scoreColor = (n) => (n >= 80 ? "good" : n >= 50 ? "ok" : "bad");
export const scoreLabel = (n) => (n >= 90 ? "Excellent" : n >= 80 ? "Bagus" : n >= 65 ? "Cukup" : n >= 50 ? "Perlu perbaikan" : "Buruk");

const phraseRegex = (list) =>
  new RegExp(`(?<![\\p{L}])(?:${[...list].sort((a, b) => b.length - a.length).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\p{L}])`, "iu");

export function analyze(input = {}) {
  const o = {
    title: "", slug: "", content: "", excerpt: "", focus: "", secondary: [], metaTitle: "", metaDescription: "",
    canonical: "", featuredImage: "", featuredAlt: "", ogImage: "", noindex: false, author: "", publishedAt: null,
    updatedAt: null, siteName: "", siteUrl: "", lang: "auto", others: [], currentId: null, defaultOgImage: "", ...input,
  };
  const S = extractStructure(o.content, o.siteUrl);
  const text = S.text;
  const lang = o.lang && o.lang !== "auto" ? o.lang : detectLang(text || o.title);
  const stop = STOPWORDS[lang];
  const allWords = words(text);
  const wc = allWords.length;
  const seoTitle = (o.metaTitle || o.title || "").trim();
  const desc = (o.metaDescription || "").trim();
  const kw = (o.focus || "").trim();

  /* ---------- helpers keyphrase ---------- */
  const tokens = (s) => words(s).map((w) => ({ raw: w.toLowerCase(), st: stem(w, lang) }));
  const contentTok = (s) => tokens(s).filter((t) => !stop.has(t.raw)).map((t) => t.st);
  const kwSeq = contentTok(kw);
  const hasKw = kwSeq.length > 0;
  const containsAll = (s, seq = kwSeq) => {
    if (!seq.length) return false;
    const set = new Set(contentTok(s));
    return seq.every((k) => set.has(k));
  };
  const phraseCount = (s, seq = kwSeq) => {
    if (!seq.length) return 0;
    const t = contentTok(s);
    let c = 0;
    for (let i = 0; i <= t.length - seq.length; i++) {
      let ok = true;
      for (let j = 0; j < seq.length; j++) if (t[i + j] !== seq[j]) { ok = false; break; }
      if (ok) { c++; i += seq.length - 1; }
    }
    return c;
  };
  const phraseIndex = (s, seq = kwSeq) => {
    const t = contentTok(s);
    for (let i = 0; i <= t.length - seq.length; i++) if (seq.every((k, j) => t[i + j] === k)) return i;
    return -1;
  };

  const checks = [];
  const add = (id, group, status, weight, label, detail, tip = "") => checks.push({ id, group, status, weight, label, detail, tip });
  const needKw = (id, group, label) => add(id, group, "info", 0, label, "Isi focus keyphrase di panel SEO untuk mengaktifkan pemeriksaan ini.");

  const subs = S.headings.filter((h) => h.level >= 2 && h.level <= 4);
  const firstPara = S.paragraphs[0]?.text || "";
  const lastPara = S.paragraphs[S.paragraphs.length - 1]?.text || "";
  const kwRawWords = words(kw).length;

  /* =============================== SEO =============================== */
  if (!hasKw) add("focus-set", "seo", "bad", 3, "Focus keyphrase", "Belum ada focus keyphrase.", "Tentukan satu frasa utama yang ingin diperingkatkan (mis. “transisi halus premiere pro”).");
  else add("focus-set", "seo", "good", 3, "Focus keyphrase", `Focus keyphrase: “${kw}”.`);

  const kwAdd = (id, label, weight, fn) => {
    if (!hasKw) return needKw(id, "seo", label);
    const [status, detail, tip] = fn();
    add(id, "seo", status, weight, label, detail, tip || "");
  };

  kwAdd("kw-title", "Keyphrase di SEO title", 3, () => {
    if (!seoTitle) return ["bad", "SEO title kosong."];
    return containsAll(seoTitle) ? ["good", "Keyphrase muncul di SEO title."] : ["bad", "Keyphrase tidak ada di SEO title.", "Masukkan semua kata keyphrase ke SEO title."];
  });
  kwAdd("kw-title-start", "Keyphrase di awal title", 1, () => {
    const i = phraseIndex(seoTitle);
    if (i === 0 || (i > 0 && i <= 2)) return ["good", "Keyphrase ada di awal title."];
    if (i > 2) return ["ok", "Keyphrase ada di title tapi tidak di awal.", "Geser keyphrase ke awal title untuk bobot lebih."];
    return containsAll(seoTitle) ? ["ok", "Kata-kata keyphrase tersebar di title, bukan frasa utuh.", "Susun kata keyphrase berurutan."] : ["bad", "Keyphrase tidak ada di title."];
  });
  kwAdd("kw-meta", "Keyphrase di meta description", 2, () => {
    if (!desc) return ["bad", "Meta description kosong.", "Tulis meta description 120–160 karakter yang memuat keyphrase."];
    return containsAll(desc) ? ["good", "Keyphrase muncul di meta description."] : ["bad", "Keyphrase tidak ada di meta description.", "Google menebalkan kata yang cocok dengan pencarian — masukkan keyphrase."];
  });
  kwAdd("kw-slug", "Keyphrase di URL (slug)", 2, () => {
    const s = (o.slug || "").replace(/-/g, " ");
    if (!s) return ["bad", "Slug belum ada."];
    return containsAll(s) ? ["good", "Slug memuat keyphrase."] : ["bad", "Slug tidak memuat keyphrase.", "Ubah slug agar memuat kata-kata utama keyphrase."];
  });
  kwAdd("kw-intro", "Keyphrase di paragraf pertama", 2, () => {
    if (!firstPara) return ["bad", "Belum ada paragraf."];
    return containsAll(firstPara) ? ["good", "Keyphrase ada di paragraf pembuka."] : ["bad", "Keyphrase belum muncul di paragraf pertama.", "Sebut keyphrase dalam 1–2 kalimat pertama."];
  });
  kwAdd("kw-subheadings", "Keyphrase di subjudul (H2–H4)", 2, () => {
    if (!subs.length) return ["bad", "Tidak ada subjudul.", "Tambahkan H2/H3 dan masukkan keyphrase di sebagian."];
    const n = subs.filter((h) => containsAll(h.text)).length;
    const pct = Math.round((n / subs.length) * 100);
    if (!n) return ["bad", "Tak ada subjudul yang memuat keyphrase.", "Pakai keyphrase (atau variasinya) di minimal satu H2."];
    if (pct > 75 && subs.length >= 3) return ["ok", `${pct}% subjudul memuat keyphrase — terlalu berlebihan.`, "Variasikan; target 30–75%."];
    return ["good", `${n} dari ${subs.length} subjudul (${pct}%) memuat keyphrase.`];
  });
  const kwCount = phraseCount(text);
  const density = wc ? (kwCount / wc) * 100 : 0;
  kwAdd("kw-density", "Kepadatan keyphrase", 2, () => {
    const d = density.toFixed(2);
    if (!kwCount) return ["bad", "Keyphrase tidak muncul di isi artikel.", "Pakai keyphrase 0,5–2,5% dari total kata."];
    if (density >= 0.5 && density <= 2.5) return ["good", `Muncul ${kwCount}× (${d}%) — ideal.`];
    if (density > 2.5 && density <= 3.5) return ["ok", `Muncul ${kwCount}× (${d}%) — agak berlebihan.`, "Kurangi sedikit atau gunakan sinonim."];
    if (density > 3.5) return ["bad", `Muncul ${kwCount}× (${d}%) — keyword stuffing.`, "Kurangi pemakaian keyphrase."];
    return ["ok", `Muncul ${kwCount}× (${d}%) — kurang.`, "Tambah penyebutan alami hingga ±0,5–1%."];
  });
  kwAdd("kw-length", "Panjang keyphrase", 1, () =>
    kwRawWords <= 4 ? ["good", `${kwRawWords} kata — ideal.`] : kwRawWords <= 6 ? ["ok", `${kwRawWords} kata — agak panjang.`, "Ringkas jadi ≤4 kata."] : ["bad", `${kwRawWords} kata — terlalu panjang.`, "Pilih frasa yang lebih ringkas."]);
  kwAdd("kw-alt", "Keyphrase di alt gambar", 1, () => {
    if (!S.images.length) return ["ok", "Belum ada gambar di isi artikel.", "Tambahkan gambar ber-alt yang memuat keyphrase."];
    return S.images.some((i) => containsAll(i.alt)) ? ["good", "Ada gambar dengan alt berisi keyphrase."] : ["bad", "Tak ada alt gambar yang memuat keyphrase.", "Deskripsikan gambar dengan memasukkan keyphrase secara natural."];
  });
  kwAdd("kw-featured-alt", "Keyphrase di alt gambar utama", 1, () => {
    if (!o.featuredImage) return ["ok", "Gambar utama belum dipilih."];
    return containsAll(o.featuredAlt) ? ["good", "Alt gambar utama memuat keyphrase."] : ["ok", "Alt gambar utama tidak memuat keyphrase.", "Isi alt gambar utama dengan deskripsi + keyphrase."];
  });
  kwAdd("kw-distribution", "Sebaran keyphrase", 1, () => {
    if (wc < 300) return ["ok", "Artikel terlalu pendek untuk menilai sebaran."];
    const size = Math.ceil(allWords.length / 3);
    let hit = 0;
    for (let i = 0; i < 3; i++) if (phraseCount(allWords.slice(i * size, (i + 1) * size).join(" ")) > 0) hit++;
    return hit === 3 ? ["good", "Keyphrase tersebar di awal, tengah, dan akhir."] : hit === 2 ? ["ok", "Keyphrase hanya ada di 2 dari 3 bagian.", "Sebut juga di bagian yang kosong."] : ["bad", "Keyphrase menumpuk di satu bagian.", "Sebarkan merata di seluruh artikel."];
  });
  kwAdd("kw-conclusion", "Keyphrase di penutup", 1, () => (containsAll(lastPara) ? ["good", "Paragraf penutup memuat keyphrase."] : ["ok", "Paragraf terakhir tidak memuat keyphrase.", "Ulangi keyphrase di kesimpulan."]));

  // kanibalisasi
  if (hasKw) {
    const setA = new Set(kwSeq);
    let exact = null, partial = null;
    for (const x of o.others || []) {
      if (!x.focus || x.id === o.currentId) continue;
      const b = contentTok(x.focus);
      if (!b.length) continue;
      const setB = new Set(b);
      const inter = [...setA].filter((k) => setB.has(k)).length;
      const jac = inter / (setA.size + setB.size - inter);
      if (jac === 1) exact = exact || x;
      else if (jac >= 0.67) partial = partial || x;
    }
    if (exact) add("kw-unique", "seo", "bad", 3, "Keyphrase unik (anti-kanibalisasi)", `Keyphrase sama dipakai di “${exact.title}”. Dua artikel akan saling bersaing di Google.`, "Pilih keyphrase berbeda, atau gabungkan/konsolidasikan kedua artikel.");
    else if (partial) add("kw-unique", "seo", "ok", 3, "Keyphrase unik (anti-kanibalisasi)", `Keyphrase sangat mirip dengan “${partial.title}”.`, "Bedakan search intent kedua artikel.");
    else add("kw-unique", "seo", "good", 3, "Keyphrase unik (anti-kanibalisasi)", "Belum dipakai artikel lain.");
  } else needKw("kw-unique", "seo", "Keyphrase unik (anti-kanibalisasi)");

  // secondary
  const secs = (o.secondary || []).map((s) => s.trim()).filter(Boolean);
  if (!secs.length) add("secondary", "seo", "info", 0, "Secondary keyphrase", "Tambahkan 1–5 keyphrase pendukung (variasi/long-tail) untuk menjangkau lebih banyak pencarian.");
  else {
    const used = secs.filter((s) => containsAll(text, contentTok(s)));
    const inHead = secs.filter((s) => subs.some((h) => containsAll(h.text, contentTok(s))));
    const st = used.length === secs.length ? (inHead.length ? "good" : "ok") : used.length ? "ok" : "bad";
    add("secondary", "seo", st, 1, "Secondary keyphrase", `${used.length}/${secs.length} dipakai di isi; ${inHead.length} muncul di subjudul.${used.length < secs.length ? " Belum dipakai: " + secs.filter((s) => !used.includes(s)).join(", ") + "." : ""}`, "Pakai tiap secondary keyphrase minimal sekali, idealnya satu di H2/H3.");
  }

  // panjang teks
  add("text-length", "seo", wc >= 600 ? "good" : wc >= 300 ? "ok" : "bad", 2, "Panjang artikel", `${wc} kata.${wc < 300 ? " Terlalu pendek." : wc < 600 ? " Cukup, tapi bisa lebih mendalam." : ""}`, wc < 600 ? "Artikel informatif biasanya ≥600 kata; pillar/panduan lengkap ≥1500 kata." : "");

  // meta desc & title length
  const dl = desc.length, dpx = pixelWidth(desc, 14);
  add("meta-length", "seo", !dl ? "bad" : dl >= 120 && dl <= 160 && dpx <= 920 ? "good" : dl >= 70 && dl <= 185 ? "ok" : "bad", 2, "Panjang meta description",
    dl ? `${dl} karakter (≈${dpx}px dari 920px desktop).` : "Meta description kosong.", "Target 120–160 karakter, ajakan jelas, dan manfaat untuk pembaca.");
  const tl = seoTitle.length, tpx = pixelWidth(seoTitle, 20);
  add("title-length", "seo", !tl ? "bad" : tl >= 30 && tpx <= 600 ? "good" : tl >= 20 && tpx <= 680 ? "ok" : "bad", 2, "Panjang SEO title",
    tl ? `${tl} karakter (≈${tpx}px dari 600px).` : "SEO title kosong.", "Target 30–60 karakter / ≤600px agar tidak terpotong di hasil pencarian.");

  // link
  const internal = S.links.filter((l) => l.internal), external = S.links.filter((l) => !l.internal);
  if (wc < 150) add("internal-links", "seo", "info", 0, "Link internal", "Tulis lebih banyak konten dulu.");
  else add("internal-links", "seo", internal.length >= 2 ? "good" : internal.length === 1 ? "ok" : "bad", 2, "Link internal", `${internal.length} link internal.`, "Tautkan ke 2–5 artikel/halaman terkait untuk menyebar otoritas & membantu crawling.");
  add("external-links", "seo", external.length >= 1 ? "good" : "ok", 1, "Link keluar", `${external.length} link keluar.`, "Rujuk 1–3 sumber otoritatif — memperkuat kepercayaan (E-E-A-T).");
  const imgCount = S.images.length + (o.featuredImage ? 1 : 0);
  add("images", "seo", imgCount >= 1 ? (wc >= 800 && imgCount < 2 ? "ok" : "good") : "bad", 1, "Gambar / media", `${imgCount} gambar (termasuk gambar utama).`, "Tambahkan gambar/video relevan, 1 per ±300–400 kata.");
  const noAlt = S.images.filter((i) => !i.alt);
  add("alt-coverage", "seo", !S.images.length ? "info" : noAlt.length ? "bad" : "good", 1, "Alt text gambar", S.images.length ? (noAlt.length ? `${noAlt.length} dari ${S.images.length} gambar tanpa alt.` : "Semua gambar punya alt.") : "Belum ada gambar.", "Alt membantu aksesibilitas & Google Images.");
  const badLinks = S.links.filter((l) => BAD_LINK_TEXTS.includes(l.text.toLowerCase().trim()));
  add("link-text", "seo", badLinks.length ? "ok" : "good", 1, "Teks anchor link", badLinks.length ? `${badLinks.length} link bertuliskan generik (“${badLinks[0].text}”).` : "Teks anchor deskriptif.", "Pakai anchor yang menjelaskan tujuan link.");

  /* ============================ TEKNIS ============================ */
  const slug = o.slug || "";
  const slugWords = slug.split("-").filter(Boolean);
  const slugOk = slug && slug.length <= 60 && slugWords.length <= 7 && !/\d{4}/.test(slug);
  add("slug-quality", "technical", !slug ? "bad" : slugOk ? "good" : "ok", 1, "Kualitas URL", slug ? `/${slug} (${slug.length} karakter, ${slugWords.length} kata).` : "Slug kosong.", "Pendek, huruf kecil, tanpa tanggal; buang kata sambung yang tak perlu.");
  if (slugWords.length && slugWords.filter((w) => GENERIC_SLUG_WORDS.has(w)).length / slugWords.length > 0.4) checks[checks.length - 1].tip += " Terlalu banyak kata sambung di slug.";
  add("robots", "technical", o.noindex ? "bad" : "good", 2, "Indexability", o.noindex ? "Artikel diset NOINDEX — tidak akan muncul di Google." : "Artikel boleh diindeks.", o.noindex ? "Matikan noindex di tab Advanced bila artikel ingin dirangking." : "");
  const canon = (o.canonical || "").trim();
  add("canonical", "technical", !canon ? "good" : /^https?:\/\//.test(canon) ? "ok" : "bad", 1, "Canonical URL", !canon ? "Otomatis self-canonical." : `Canonical kustom: ${canon}`, canon ? "Pastikan canonical memang mengarah ke versi utama (bukan salah ketik)." : "");
  const ogImg = o.ogImage || o.featuredImage || o.defaultOgImage;
  add("og-image", "technical", ogImg ? "good" : "ok", 1, "Gambar social share (OG)", ogImg ? "Gambar OG tersedia." : "Belum ada gambar OG.", "Pakai 1200×630px agar rapi di WhatsApp/Facebook/LinkedIn/X.");
  add("featured-image", "technical", o.featuredImage ? "good" : "bad", 1, "Gambar utama", o.featuredImage ? "Gambar utama diset." : "Gambar utama belum dipilih.", "Gambar utama dipakai di daftar artikel, OG, dan schema.");
  const h1s = S.headings.filter((h) => h.level === 1).length;
  add("h1", "technical", h1s ? "ok" : "good", 1, "Struktur H1", h1s ? `Ada ${h1s} H1 di isi. Judul artikel sudah otomatis jadi H1 di halaman, jadi H1 di isi akan dirender sebagai H2 agar tidak ganda.` : "Judul artikel menjadi satu-satunya H1 — benar.", "Pakai H2 untuk bagian utama, H3 untuk sub-bagian.");
  let skipped = 0;
  for (let i = 0; i < S.headings.length; i++) {
    const prev = i === 0 ? 1 : S.headings[i - 1].level;
    if (S.headings[i].level - prev > 1) skipped++;
  }
  add("heading-hierarchy", "technical", !S.headings.length ? "info" : skipped ? "ok" : "good", 1, "Hierarki heading", S.headings.length ? (skipped ? `${skipped} lompatan level (mis. H2 → H4).` : "Hierarki heading rapi.") : "Belum ada heading.", "Jangan loncat level; H2 → H3 → H4.");
  const dup = S.headings.map((h) => h.text.toLowerCase()).filter((t, i, a) => t && a.indexOf(t) !== i);
  add("duplicate-headings", "technical", dup.length ? "ok" : "good", 1, "Heading unik", dup.length ? `Heading ganda: “${dup[0]}”.` : "Tidak ada heading ganda.", "Tiap heading sebaiknya unik.");
  const longSections = S.sections.filter((s) => s.words > 300);
  add("section-length", "technical", wc < 300 ? "info" : longSections.length === 0 ? "good" : longSections.length === 1 ? "ok" : "bad", 1, "Distribusi subjudul", wc < 300 ? "Artikel masih pendek." : longSections.length ? `${longSections.length} bagian >300 kata tanpa subjudul.` : "Subjudul tersebar baik.", "Pecah bagian panjang dengan H2/H3 agar mudah dipindai.");
  const toc = buildToc(o.content);
  const faq = extractFaq(o.content);
  add("schema", "technical", "good", 1, "Structured data (JSON-LD)", `Schema ${"Article/BlogPosting"} + BreadcrumbList otomatis${faq.length >= 2 ? ` + FAQPage (${faq.length} Q&A)` : ""}.`, faq.length < 2 ? "Tambahkan 2+ heading berbentuk pertanyaan (H2/H3 berakhiran “?”) agar FAQ schema aktif." : "");
  add("toc", "technical", wc >= 1200 && toc.length >= 4 ? "good" : "info", wc >= 1200 ? 1 : 0, "Daftar isi otomatis", toc.length >= 3 ? `Halaman publik menampilkan daftar isi (${toc.length} entri).` : "Daftar isi tampil otomatis jika ada ≥3 subjudul.", "");

  /* =========================== KETERBACAAN =========================== */
  const bodyWords = words(S.bodyText);
  const sents = sentences(S.bodyText);
  const bw = bodyWords.length;
  const asl = sents.length ? bw / sents.length : 0;
  const longWordsPct = bw ? (bodyWords.filter((w) => w.length > 6).length / bw) * 100 : 0;
  const lix = asl + longWordsPct;
  const syll = bodyWords.reduce((a, w) => a + countSyllables(w, lang), 0);
  const flesch = bw && sents.length ? 206.835 - 1.015 * asl - 84.6 * (syll / bw) : 0;
  if (bw < 50) add("readability", "readability", "info", 0, "Skor keterbacaan", "Tulis ≥50 kata untuk menghitung keterbacaan.");
  else if (lang === "en") add("readability", "readability", flesch >= 60 ? "good" : flesch >= 50 ? "ok" : "bad", 2, "Keterbacaan (Flesch)", `Flesch ${flesch.toFixed(0)} · LIX ${lix.toFixed(0)}.`, "Pakai kalimat lebih pendek dan kata lebih sederhana.");
  else add("readability", "readability", lix <= 50 ? "good" : lix <= 58 ? "ok" : "bad", 2, "Keterbacaan (LIX, disesuaikan Bahasa Indonesia)", `LIX ${lix.toFixed(0)} — rata-rata ${asl.toFixed(1)} kata/kalimat, ${longWordsPct.toFixed(0)}% kata panjang.`, "Pendekkan kalimat dan pilih kata lebih ringkas.");
  const longSent = sents.filter((s) => words(s).length > 20);
  const longPct = sents.length ? (longSent.length / sents.length) * 100 : 0;
  add("sentence-length", "readability", bw < 50 ? "info" : longPct <= 25 ? "good" : longPct <= 35 ? "ok" : "bad", bw < 50 ? 0 : 2, "Panjang kalimat", bw < 50 ? "Belum cukup teks." : `${longPct.toFixed(0)}% kalimat >20 kata (maks. 25%).`, "Pecah kalimat panjang jadi dua.");
  const longParas = S.paragraphs.filter((p) => words(p.text).length > 150);
  const medParas = S.paragraphs.filter((p) => words(p.text).length > 100);
  add("paragraph-length", "readability", !S.paragraphs.length ? "info" : longParas.length ? "bad" : medParas.length > S.paragraphs.length / 3 ? "ok" : "good", S.paragraphs.length ? 1 : 0, "Panjang paragraf", longParas.length ? `${longParas.length} paragraf >150 kata.` : "Paragraf ringkas.", "Target 2–4 kalimat (≤100 kata) per paragraf.");
  const trRe = phraseRegex(TRANSITIONS[lang]);
  const trCount = sents.filter((s) => trRe.test(s)).length;
  const trPct = sents.length ? (trCount / sents.length) * 100 : 0;
  add("transitions", "readability", sents.length < 5 ? "info" : trPct >= 30 ? "good" : trPct >= 20 ? "ok" : "bad", sents.length < 5 ? 0 : 1, "Kata transisi", sents.length < 5 ? "Belum cukup kalimat." : `${trPct.toFixed(0)}% kalimat memakai kata transisi (min. 30%).`, "Pakai “namun”, “selain itu”, “karena itu”, dst. untuk menyambung ide.");
  let runs = 0, run = 1;
  for (let i = 1; i < sents.length; i++) {
    const a = words(sents[i - 1])[0]?.toLowerCase(), b = words(sents[i])[0]?.toLowerCase();
    if (a && a === b) { run++; if (run === 3) runs++; } else run = 1;
  }
  add("consecutive", "readability", sents.length < 5 ? "info" : runs ? "ok" : "good", sents.length < 5 ? 0 : 1, "Variasi awal kalimat", runs ? `${runs}× ada 3+ kalimat berturut-turut diawali kata sama.` : "Awal kalimat bervariasi.", "Ubah pembuka agar ritme tidak monoton.");
  const NOT_PASSIVE = /^(dimana|dibawah|diatas|disini|disana|didalam|diluar|disamping|disekitar|dibelakang|didepan|diri|dirinya|diam|dikit|dinamis|diskon|diskusi|digital|direktur|distribusi|disiplin|diagram|dialog|diameter|dimensi|display|disain|dibanding)$/i;
  const isPassive = (s) => {
    const ws = words(s);
    if (lang === "en") {
      if (/\b(?:is|are|was|were|be|been|being)\s+\w+(?:ed|en)\b/i.test(s)) return true;
      return ws.some((w, i) => i > 0 && /^(is|are|was|were|be|been|being)$/i.test(ws[i - 1]) && EN_IRREGULAR_PARTICIPLES.has(w.toLowerCase()));
    }
    return ws.some((w) => /^di[a-z]{4,}$/i.test(w) && !NOT_PASSIVE.test(w));
  };
  const passive = sents.filter(isPassive).length;
  const passPct = sents.length ? (passive / sents.length) * 100 : 0;
  const passMax = lang === "en" ? 10 : 20;
  add("passive", "readability", sents.length < 5 ? "info" : passPct <= passMax ? "good" : passPct <= passMax + 10 ? "ok" : "bad", sents.length < 5 ? 0 : 1, "Kalimat pasif", sents.length < 5 ? "Belum cukup kalimat." : `${passPct.toFixed(0)}% kalimat pasif (maks. ${passMax}%).`, "Gunakan kalimat aktif agar lebih langsung.");

  /* ============================== GEO / AI ============================== */
  const fpw = words(firstPara).length;
  add("geo-answer-first", "geo", !fpw ? "bad" : fpw >= 15 && fpw <= 60 ? (hasKw && !containsAll(firstPara) ? "ok" : "good") : "ok", 2, "Jawaban langsung di paragraf pertama",
    !fpw ? "Belum ada paragraf pembuka." : `Paragraf pembuka ${fpw} kata${hasKw && !containsAll(firstPara) ? " dan belum menyebut topik utama" : ""}.`, "AI search (Google AI Overviews, ChatGPT, Perplexity) mengutip jawaban ringkas 15–60 kata di awal.");
  const qRe = new RegExp(`^(?:${QUESTION_WORDS[lang].join("|")})\\b`, "i");
  const qHeads = S.headings.filter((h) => h.level >= 2 && (/\?\s*$/.test(h.text) || qRe.test(h.text)));
  add("geo-question-headings", "geo", qHeads.length >= 2 ? "good" : qHeads.length === 1 ? "ok" : "bad", 2, "Heading berbentuk pertanyaan", `${qHeads.length} heading pertanyaan.`, "Tulis H2/H3 sebagai pertanyaan nyata yang dicari orang (“Bagaimana cara…?”).");
  add("geo-faq", "geo", faq.length >= 2 ? "good" : faq.length === 1 ? "ok" : "bad", 1, "Bagian FAQ (schema FAQPage)", `${faq.length} pasangan tanya-jawab terdeteksi.`, "Heading berakhiran “?” + paragraf jawaban otomatis dijadikan FAQPage JSON-LD.");
  const structured = S.counts.lists + S.counts.tables;
  add("geo-structured", "geo", S.counts.lists && S.counts.tables ? "good" : structured ? "ok" : "bad", 1, "Format terstruktur (list / tabel)", `${S.counts.lists} list, ${S.counts.tables} tabel.`, "Mesin AI mudah mengekstrak daftar langkah dan tabel perbandingan.");
  const nums = (text.match(/\b\d[\d.,%]*\b/g) || []).length;
  add("geo-data", "geo", nums >= 5 ? "good" : nums >= 2 ? "ok" : "bad", 1, "Data & fakta spesifik", `${nums} angka/data di artikel.`, "Angka, statistik, dan contoh konkret meningkatkan peluang dikutip.");
  add("geo-sources", "geo", external.length >= 2 ? "good" : external.length === 1 ? "ok" : "bad", 1, "Sitasi sumber", `${external.length} sumber eksternal.`, "Rujuk sumber kredibel; AI lebih percaya konten yang bersumber.");
  add("geo-eeat", "geo", o.author && o.publishedAt ? "good" : o.author || o.publishedAt ? "ok" : "bad", 2, "Sinyal E-E-A-T (penulis & tanggal)", `${o.author ? "Penulis: " + o.author : "Penulis belum diisi"}; ${o.publishedAt ? "tanggal publikasi ada" : "belum dipublikasikan"}.`, "Tampilkan nama penulis & tanggal — dipakai di schema Article.");
  const ref = o.updatedAt || o.publishedAt;
  const ageDays = ref ? (Date.now() - new Date(ref).getTime()) / 86400000 : null;
  add("geo-freshness", "geo", ageDays === null ? "info" : ageDays <= 365 ? "good" : ageDays <= 730 ? "ok" : "bad", ageDays === null ? 0 : 1, "Kesegaran konten", ageDays === null ? "Belum ada tanggal." : `Terakhir diperbarui ${Math.round(ageDays)} hari lalu.`, "Perbarui artikel minimal setahun sekali.");
  const snippable = S.paragraphs.filter((p) => { const n = words(p.text).length; return n >= 25 && n <= 80; });
  add("geo-snippet", "geo", S.paragraphs.length < 3 ? "info" : snippable.length / S.paragraphs.length >= 0.5 ? "good" : "ok", S.paragraphs.length < 3 ? 0 : 1, "Paragraf siap dikutip", S.paragraphs.length < 3 ? "Belum cukup paragraf." : `${snippable.length}/${S.paragraphs.length} paragraf 25–80 kata.`, "Paragraf mandiri 25–80 kata mudah diambil sebagai snippet/AI answer.");
  const faqSecs = S.sections.filter((s) => s.heading && /\?\s*$/.test(s.heading.text));
  if (faqSecs.length) {
    const concise = faqSecs.filter((s) => s.words > 0 && s.words <= 90).length;
    add("geo-concise-answers", "geo", concise === faqSecs.length ? "good" : concise ? "ok" : "bad", 1, "Jawaban ringkas di bawah pertanyaan", `${concise}/${faqSecs.length} jawaban ≤90 kata.`, "Mulai tiap jawaban dengan 1–2 kalimat langsung, lalu elaborasi.");
  }

  /* ============================== SKOR ============================== */
  const groups = {};
  for (const g of Object.keys(GROUPS)) {
    const cs = checks.filter((c) => c.group === g && c.status !== "info" && c.weight > 0);
    const sum = cs.reduce((a, c) => a + c.weight, 0);
    const got = cs.reduce((a, c) => a + c.weight * VAL[c.status], 0);
    groups[g] = { ...GROUPS[g], score: sum ? Math.round((got / sum) * 100) : null, good: cs.filter((c) => c.status === "good").length, ok: cs.filter((c) => c.status === "ok").length, bad: cs.filter((c) => c.status === "bad").length };
  }
  let wsum = 0, acc = 0;
  for (const g of Object.keys(groups)) if (groups[g].score !== null) { wsum += GROUPS[g].weight; acc += GROUPS[g].weight * groups[g].score; }
  const score = wsum ? Math.round(acc / wsum) : 0;

  /* ============================== INSIGHT ============================== */
  const termCounts = new Map();
  for (const s of sentences(text)) {
    const toks = words(s).map((w) => w.toLowerCase());
    for (let n = 1; n <= 3; n++) {
      for (let i = 0; i + n <= toks.length; i++) {
        const g = toks.slice(i, i + n);
        if (g.some((w) => stop.has(w) || w.length < 3 || /^\d+$/.test(w))) continue;
        if (n === 1 && g[0].length < 4) continue;
        const key = g.join(" ");
        termCounts.set(key, (termCounts.get(key) || 0) + 1);
      }
    }
  }
  const topTerms = [...termCounts.entries()]
    .map(([term, count]) => ({ term, count, n: term.split(" ").length }))
    .filter((t) => (t.n === 1 ? t.count >= 3 : t.count >= 2))
    .sort((a, b) => b.count * (1 + (b.n - 1) * 0.6) - a.count * (1 + (a.n - 1) * 0.6))
    .slice(0, 14)
    .map((t) => ({ ...t, density: wc ? +((t.count * t.n) / wc * 100).toFixed(2) : 0 }));
  const suggestedKeyphrases = topTerms.filter((t) => t.n >= 2).slice(0, 6).map((t) => t.term);

  const kwStats = [kw, ...secs].filter(Boolean).map((k, i) => {
    const seq = contentTok(k);
    const c = phraseCount(text, seq);
    return { keyphrase: k, primary: i === 0, count: c, density: wc ? +((c / wc) * 100).toFixed(2) : 0 };
  });

  // saran internal link
  const mySet = new Set(topTerms.filter((t) => t.n === 1).map((t) => stem(t.term, lang)));
  for (const k of kwSeq) mySet.add(k);
  const linkedSlugs = new Set(internal.map((l) => l.href.replace(/\/$/, "").split("/").pop()));
  const internalSuggestions = (o.others || [])
    .filter((x) => x.id !== o.currentId && x.slug && x.status !== "draft" && !linkedSlugs.has(x.slug))
    .map((x) => {
      const hay = contentTok(`${x.title} ${x.focus || ""} ${(x.tags || []).join(" ")}`);
      const matched = [...new Set(hay.filter((h) => mySet.has(h)))];
      return { id: x.id, title: x.title, slug: x.slug, score: matched.length, matched };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const sc = {
    wordCount: wc, charCount: text.length, sentenceCount: sents.length, paragraphCount: S.paragraphs.length,
    readingMinutes: Math.max(1, Math.round(wc / 200)), avgSentence: +asl.toFixed(1), lix: +lix.toFixed(0),
    flesch: lang === "en" ? +flesch.toFixed(0) : null, headingCount: S.headings.length, imageCount: imgCount,
    internalLinks: internal.length, externalLinks: external.length,
  };

  return {
    score, grade: scoreLabel(score), color: scoreColor(score), lang, groups, checks,
    insights: { ...sc, topTerms, suggestedKeyphrases, keyphrases: kwStats, toc, faq, internalSuggestions, titlePx: tpx, descPx: dpx },
  };
}
