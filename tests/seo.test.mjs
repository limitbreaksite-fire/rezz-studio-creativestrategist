import test from "node:test";
import assert from "node:assert/strict";
import { analyze } from "../lib/seo/analyzer.js";
import { buildArticleSchema } from "../lib/seo/schema.js";
import { sanitizeHtml } from "../lib/sanitize.js";
import { slugify, pixelWidth, stem, extractFaq, buildToc } from "../lib/seo/text.js";

const good = {
  title: "Cara Membuat Transisi Halus di Premiere Pro",
  slug: "transisi-halus-premiere-pro",
  focus: "transisi halus premiere pro",
  secondary: ["match cut"],
  metaTitle: "Transisi Halus Premiere Pro: 3 Teknik Tanpa Plugin",
  metaDescription: "Pelajari transisi halus di Premiere Pro: match cut, J-cut, dan motion blur. Panduan langkah demi langkah untuk editor pemula hingga mahir.",
  author: "Rezz", publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  featuredImage: "/uploads/a.jpg", featuredAlt: "Transisi halus premiere pro di timeline",
  siteUrl: "https://rezz.studio",
  content:
    "<p>Transisi halus Premiere Pro dibuat dari ritme potongan, bukan dari efek. Gunakan match cut dan J-cut agar perpindahan adegan terasa natural bagi penonton.</p>" +
    "<h2>Kenapa transisi halus premiere pro penting?</h2><p>Penonton jarang sadar pada transisi yang bagus. Namun mereka langsung merasakan potongan yang kasar. Karena itu, transisi halus menjaga perhatian tetap mengalir. Selain itu, ritme yang baik membuat cerita lebih mudah diikuti sampai akhir video.</p>" +
    "<h2>Langkah membuat transisi</h2><ol><li>Pilih titik potong pada gerakan yang sama.</li><li>Tumpuk audio sebelum visual berganti.</li><li>Tambahkan motion blur ringan.</li></ol>" +
    "<p>Misalnya, pada video sport kamu bisa memakai whip pan sepanjang 6 frame. Lihat <a href=\"/articles/color-grading\">panduan color grading</a> dan <a href=\"/articles/audio\">audio</a> untuk melengkapinya, serta <a href=\"https://helpx.adobe.com/premiere-pro\">dokumentasi Adobe</a>.</p>" +
    "<h3>Perbandingan teknik match cut</h3><table><tr><th>Teknik</th><th>Level</th></tr><tr><td>Match cut</td><td>Menengah</td></tr></table><img src=\"/uploads/a.jpg\" alt=\"Contoh transisi halus premiere pro\">" +
    "<h2>Apakah perlu plugin transisi?</h2><p>Tidak. Sebagian besar transisi halus bisa dibuat dengan fitur bawaan Premiere Pro dan timing yang tepat.</p>" +
    "<h2>Bagaimana cara melatih ritme?</h2><p>Tonton ulang hasil editan tanpa suara, lalu dengarkan hanya audionya. Dengan begitu kamu menilai transisi halus premiere pro dari dua sisi.</p>",
};

test("artikel yang dioptimasi mendapat skor tinggi", () => {
  const r = analyze(good);
  console.log("skor:", r.score, JSON.stringify(Object.fromEntries(Object.entries(r.groups).map(([k, v]) => [k, v.score]))));
  console.log("lang:", r.lang, "| LIX:", r.insights.lix, "| kata:", r.insights.wordCount);
  console.log(r.checks.filter((c) => c.status !== "good" && c.status !== "info").map((c) => `${c.status} ${c.id}: ${c.detail}`).join("\n"));
  assert.equal(r.lang, "id");
  assert.ok(r.score >= 70, `skor terlalu rendah: ${r.score}`);
  assert.equal(r.checks.find((c) => c.id === "kw-title").status, "good");
  assert.equal(r.checks.find((c) => c.id === "kw-slug").status, "good");
  assert.equal(r.checks.find((c) => c.id === "kw-intro").status, "good");
  assert.ok(r.insights.faq.length >= 2);
});

test("artikel kosong mendapat skor rendah & tidak crash", () => {
  const r = analyze({});
  assert.ok(r.score < 50);
  assert.equal(r.checks.find((c) => c.id === "focus-set").status, "bad");
});

test("tanpa keyphrase, cek keyphrase tidak dihitung", () => {
  const r = analyze({ ...good, focus: "" });
  assert.equal(r.checks.find((c) => c.id === "kw-title").status, "info");
});

test("deteksi kanibalisasi keyphrase", () => {
  const r = analyze({ ...good, currentId: "1", others: [{ id: "2", title: "Artikel lain", focus: "Transisi halus Premiere Pro", slug: "x" }] });
  assert.equal(r.checks.find((c) => c.id === "kw-unique").status, "bad");
});

test("noindex, keyword stuffing & H1 terdeteksi", () => {
  const stuffed = "<h1>x</h1><p>" + "transisi halus premiere pro ".repeat(40) + "</p>";
  const r = analyze({ ...good, noindex: true, content: stuffed });
  assert.equal(r.checks.find((c) => c.id === "robots").status, "bad");
  assert.equal(r.checks.find((c) => c.id === "kw-density").status, "bad");
  assert.equal(r.checks.find((c) => c.id === "h1").status, "ok");
});

test("English content", () => {
  const r = analyze({ title: "Color grading basics", slug: "color-grading-basics", focus: "color grading", content: "<p>Color grading shapes the mood of every film. It is used by editors to guide emotion. However, many beginners skip it.</p><h2>Why color grading matters</h2><p>Good grading is noticed by nobody and felt by everybody.</p>" });
  assert.equal(r.lang, "en");
  assert.ok(r.insights.flesch !== null);
});

test("sanitizer membuang script/handler & mengizinkan embed YouTube saja", () => {
  const dirty = '<p onclick="x()">Hi<script>alert(1)</script></p><a href="javascript:alert(1)">x</a><img src="x" onerror="alert(1)" alt="a"><iframe src="https://evil.com/x"></iframe><iframe src="https://www.youtube.com/embed/abc123" allowfullscreen></iframe><style>body{}</style>';
  const clean = sanitizeHtml(dirty);
  assert.ok(!/script|onclick|onerror|javascript:|evil\.com|<style/i.test(clean), clean);
  assert.ok(/youtube\.com\/embed\/abc123/.test(clean));
  assert.ok(/<img src="x" alt="a">/.test(clean));
});

test("util: slugify, stem, pixelWidth, TOC, schema", () => {
  assert.equal(slugify("Cara Membuat Transisi & Efek!"), "cara-membuat-transisi-dan-efek");
  assert.equal(stem("pertanyaan", "id"), stem("bertanya", "id"));
  assert.ok(pixelWidth("Hello world", 20) > 80);
  assert.ok(buildToc(good.content).length >= 3);
  assert.ok(extractFaq(good.content).length >= 2);
  const schema = buildArticleSchema({ article: { ...good, slug: good.slug, seo: { schemaType: "BlogPosting" } }, settings: { siteUrl: "https://rezz.studio", siteName: "Rezz" }, siteUrl: "https://rezz.studio" });
  const types = schema["@graph"].map((g) => g["@type"]);
  assert.deepEqual(types, ["BlogPosting", "BreadcrumbList", "FAQPage"]);
});
