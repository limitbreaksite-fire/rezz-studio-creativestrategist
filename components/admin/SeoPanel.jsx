"use client";
// Panel SEO lengkap: skor, keyphrase, checklist 4 kategori (SEO/Keterbacaan/Teknis/GEO), SERP & social preview,
// schema JSON-LD, saran internal link, anti-kanibalisasi, kepadatan keyphrase, dll.
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import AIcon from "./AIcon";
import { Tags, useToast } from "./ui";
import { ImageField } from "./MediaPicker";
import { GROUPS, scoreColor } from "@/lib/seo/analyzer";
import { buildArticleSchema } from "@/lib/seo/schema";
import { pixelWidth, slugify, stripTags, words } from "@/lib/seo/text";

const STATUS_LABEL = { bad: "Masalah", ok: "Perlu perbaikan", good: "Bagus", info: "Info" };
const COLORS = { good: "#22c55e", ok: "#f59e0b", bad: "#ef4444" };

function Ring({ score, size = 84 }) {
  const r = (size - 10) / 2, c = 2 * Math.PI * r, col = COLORS[scoreColor(score)];
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`Skor SEO ${score} dari 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="8" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={false} animate={{ strokeDashoffset: c * (1 - score / 100) }} transition={{ duration: 0.7, ease: "easeOut" }} />
      </svg>
      <b>{score}</b>
    </div>
  );
}

function Meter({ value, max, lo, hi, over }) {
  const pct = Math.min(100, (value / max) * 100);
  const c = value === 0 ? "bad" : value > over || value < lo * 0.6 ? "bad" : value >= lo && value <= hi ? "good" : "ok";
  return <div className="meter"><i className={c} style={{ width: `${pct}%` }} /></div>;
}

function hl(text, focus) {
  const ws = words(focus).filter((w) => w.length > 2);
  if (!ws.length || !text) return text;
  const re = new RegExp(`(${ws.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(re).map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p));
}

function Serp({ art, settings, device }) {
  const seo = art.seo;
  const title = (seo.metaTitle || art.title || "Judul artikel").trim();
  const desc = (seo.metaDescription || art.excerpt || stripTags(art.content).replace(/\n/g, " ").slice(0, 155) || "Tulis meta description agar tampil di sini.").trim();
  const base = (settings?.siteUrl || "https://rezz.studio").replace(/^https?:\/\//, "");
  const date = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  return (
    <div className={`serp ${device}`}>
      <div className="serp-site"><span className="serp-fav"><img src="/brand/logo-mark-black.png" alt="" /></span><div><b>{settings?.siteName || "Rezz"}</b><small>{base} › articles › {art.slug || "slug-artikel"}</small></div></div>
      <h4>{title}</h4>
      <p>{device === "mobile" && <span className="serp-date">{date} — </span>}{hl(desc, seo.focusKeyphrase)}</p>
    </div>
  );
}

export default function SeoPanel({ art, setSeo, setArt, analysis, settings, onInsertLink }) {
  const toast = useToast();
  const [tab, setTab] = useState("analysis");
  const [filter, setFilter] = useState("all");
  const [device, setDevice] = useState("desktop");
  const [open, setOpen] = useState({ bad: true, ok: true, good: false, info: false });
  const [expanded, setExpanded] = useState(null);
  const seo = art.seo;
  const A = analysis;
  const ins = A.insights;

  const buckets = useMemo(() => {
    const m = { bad: [], ok: [], good: [], info: [] };
    for (const c of A.checks) if (filter === "all" || c.group === filter) m[c.status].push(c);
    return m;
  }, [A, filter]);

  const titlePx = pixelWidth(seo.metaTitle || art.title || "", 20);
  const descLen = (seo.metaDescription || "").length;
  const schema = useMemo(() => {
    try { return JSON.stringify(buildArticleSchema({ article: { ...art, publishedAt: art.publishedAt || new Date().toISOString() }, settings, siteUrl: settings?.siteUrl }), null, 2); } catch { return ""; }
  }, [art, settings]);

  const autoDesc = () => {
    const first = stripTags(art.content).split("\n").find((l) => words(l).length > 8) || "";
    let d = first.replace(/\s+/g, " ").trim();
    if (d.length > 155) d = d.slice(0, 155).replace(/\s+\S*$/, "") + "…";
    if (!d) return toast.error("Tulis paragraf pembuka dulu.");
    setSeo({ metaDescription: d });
  };
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); toast("Disalin"); } catch { toast.error("Gagal menyalin"); } };

  const tabs = [["analysis", "Analisis", "bolt"], ["serp", "Google", "search"], ["social", "Sosial", "globe"], ["schema", "Schema", "code"], ["adv", "Advanced", "settings"]];

  return (
    <div className="seo">
      <div className="seo-tabs" role="tablist">
        {tabs.map(([k, l, ic]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}><AIcon name={ic} size={14} /><span>{l}</span></button>)}
      </div>

      {/* Keyphrase — selalu terlihat */}
      <div className="seo-kw">
        <div className="field"><label htmlFor="fk">Focus keyphrase</label>
          <input id="fk" value={seo.focusKeyphrase} onChange={(e) => setSeo({ focusKeyphrase: e.target.value })} placeholder="mis. transisi halus premiere pro" />
        </div>
        <div className="field"><label>Secondary keyphrase <small className="hint inline">(maks. 5)</small></label>
          <Tags value={seo.secondaryKeyphrases} onChange={(v) => setSeo({ secondaryKeyphrases: v })} max={5} placeholder="long-tail / variasi…" />
        </div>
        {!seo.focusKeyphrase && ins.suggestedKeyphrases.length > 0 && (
          <div className="sugg"><small>Saran dari isi artikel:</small>{ins.suggestedKeyphrases.slice(0, 4).map((k) => <button key={k} type="button" className="chip-btn" onClick={() => setSeo({ focusKeyphrase: k })}>{k}</button>)}</div>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {tab === "analysis" && (
            <>
              <div className="seo-score">
                <Ring score={A.score} />
                <div>
                  <b className={`grade ${A.color}`}>{A.grade}</b>
                  <small className="muted">{ins.wordCount} kata · {ins.readingMinutes} menit baca · bahasa terdeteksi: {A.lang === "id" ? "Indonesia" : "English"}</small>
                </div>
              </div>
              <div className="gbars">
                {Object.entries(A.groups).map(([k, g]) => (
                  <button key={k} className={`gbar ${filter === k ? "on" : ""}`} onClick={() => setFilter(filter === k ? "all" : k)} aria-pressed={filter === k}>
                    <span>{g.label}</span><i><u className={g.score === null ? "" : scoreColor(g.score)} style={{ width: `${g.score ?? 0}%` }} /></i><b>{g.score ?? "—"}</b>
                  </button>
                ))}
              </div>

              {["bad", "ok", "good", "info"].map((st) => buckets[st].length > 0 && (
                <section key={st} className="chk-sec">
                  <button className="chk-head" onClick={() => setOpen((o) => ({ ...o, [st]: !o[st] }))} aria-expanded={open[st]}>
                    <span className={`dot ${st}`} /> {STATUS_LABEL[st]} <em>{buckets[st].length}</em><AIcon name="chevron" size={14} className={open[st] ? "open" : ""} />
                  </button>
                  {open[st] && (
                    <ul className="chk-list">
                      {buckets[st].map((c) => (
                        <li key={c.id} className={expanded === c.id ? "ex" : ""}>
                          <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} aria-expanded={expanded === c.id}>
                            <span className={`dot ${c.status}`} /><span><b>{c.label}</b><small>{c.detail}</small></span>
                            {(c.tip || c.status !== "good") && <AIcon name="chevron" size={13} className="mut" />}
                          </button>
                          {expanded === c.id && c.tip && <p className="tip"><AIcon name="sparkle" size={13} /> {c.tip}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              <section className="insights">
                <h5>Insight konten</h5>
                <div className="kpis">
                  {[["Kata", ins.wordCount], ["Kalimat", ins.sentenceCount], ["Rata² kata/kalimat", ins.avgSentence], [A.lang === "en" ? "Flesch" : "LIX", A.lang === "en" ? ins.flesch : ins.lix], ["Heading", ins.headingCount], ["Gambar", ins.imageCount], ["Link internal", ins.internalLinks], ["Link keluar", ins.externalLinks]].map(([l, v]) => <div key={l}><b>{v ?? "—"}</b><small>{l}</small></div>)}
                </div>

                {ins.keyphrases.length > 0 && (
                  <>
                    <h5>Kepadatan keyphrase</h5>
                    <table className="mini-table"><thead><tr><th>Keyphrase</th><th>Muncul</th><th>Densitas</th></tr></thead>
                      <tbody>{ins.keyphrases.map((k) => <tr key={k.keyphrase}><td>{k.primary && "🎯 "}{k.keyphrase}</td><td>{k.count}×</td><td className={k.density > 3 ? "bad-t" : k.density >= 0.5 ? "good-t" : "ok-t"}>{k.density}%</td></tr>)}</tbody></table>
                  </>
                )}

                {ins.topTerms.length > 0 && (
                  <>
                    <h5>Kata & frasa dominan <small className="muted">(klik untuk jadikan keyphrase)</small></h5>
                    <div className="terms">{ins.topTerms.map((t) => <button key={t.term} type="button" className="chip-btn" onClick={() => setSeo(t.n > 1 || !seo.focusKeyphrase ? { focusKeyphrase: t.term } : { secondaryKeyphrases: [...new Set([...seo.secondaryKeyphrases, t.term])].slice(0, 5) })}>{t.term} <em>{t.count}</em></button>)}</div>
                  </>
                )}

                {ins.internalSuggestions.length > 0 && (
                  <>
                    <h5>Saran internal link</h5>
                    <ul className="il-list">{ins.internalSuggestions.map((s) => (
                      <li key={s.id}><div><b>{s.title}</b><small>/articles/{s.slug}</small></div><button type="button" className="abtn ghost sm" onClick={() => onInsertLink(`/articles/${s.slug}`, s.title)}>Sisipkan</button></li>
                    ))}</ul>
                  </>
                )}

                {ins.faq.length > 0 && (<><h5>FAQ terdeteksi ({ins.faq.length}) → FAQPage schema</h5><ul className="plain">{ins.faq.map((f) => <li key={f.question}>{f.question}</li>)}</ul></>)}
                {ins.toc.length > 0 && (<><h5>Struktur heading</h5><ul className="toc-prev">{ins.toc.map((t, i) => <li key={i} className={`l${t.level}`}>{t.text}</li>)}</ul></>)}
              </section>
            </>
          )}

          {tab === "serp" && (
            <>
              <div className="seg sm">{[["desktop", "Desktop", "desktop"], ["mobile", "Mobile", "phone"]].map(([k, l, ic]) => <button key={k} className={device === k ? "on" : ""} onClick={() => setDevice(k)}><AIcon name={ic} size={14} /> {l}</button>)}</div>
              <Serp art={art} settings={settings} device={device} />
              <div className="field"><label htmlFor="mt">SEO title <small className="hint inline">{(seo.metaTitle || "").length} karakter · ≈{titlePx}px / 600px</small></label>
                <input id="mt" value={seo.metaTitle} onChange={(e) => setSeo({ metaTitle: e.target.value })} placeholder={art.title || "Judul untuk hasil pencarian"} />
                <Meter value={titlePx} max={680} lo={300} hi={600} over={620} /></div>
              <div className="field"><label htmlFor="sl">Slug (URL)</label>
                <div className="slug-row"><span>/articles/</span><input id="sl" value={art.slug} onChange={(e) => setArt({ slug: slugify(e.target.value), slugTouched: true })} placeholder="slug-artikel" /></div></div>
              <div className="field"><label htmlFor="md">Meta description <small className="hint inline">{descLen} karakter · ideal 120–160</small></label>
                <textarea id="md" rows={3} value={seo.metaDescription} onChange={(e) => setSeo({ metaDescription: e.target.value })} placeholder="Ringkasan menarik dengan keyphrase dan ajakan." />
                <Meter value={descLen} max={200} lo={120} hi={160} over={185} />
                <div className="row-gap"><button type="button" className="chip-btn" onClick={autoDesc}><AIcon name="sparkle" size={13} /> Buat dari paragraf pembuka</button>{seo.focusKeyphrase && <button type="button" className="chip-btn" onClick={() => setSeo({ metaTitle: seo.focusKeyphrase.replace(/\b\w/g, (m) => m.toUpperCase()) + (art.title && !art.title.toLowerCase().includes(seo.focusKeyphrase.toLowerCase()) ? `: ${art.title}` : "") })}>Title dari keyphrase</button>}</div>
              </div>
            </>
          )}

          {tab === "social" && (
            <>
              <div className="field"><label htmlFor="ot">Judul sosial (OG title)</label><input id="ot" value={seo.ogTitle} onChange={(e) => setSeo({ ogTitle: e.target.value })} placeholder={seo.metaTitle || art.title} /></div>
              <div className="field"><label htmlFor="od">Deskripsi sosial</label><textarea id="od" rows={2} value={seo.ogDescription} onChange={(e) => setSeo({ ogDescription: e.target.value })} placeholder={seo.metaDescription} /></div>
              <ImageField label="Gambar sosial (1200×630)" value={seo.ogImage} onChange={(u) => setSeo({ ogImage: u })} hint="Jika kosong dipakai gambar utama artikel, lalu gambar default situs." />
              {(() => {
                const img = seo.ogImage || art.featuredImage || settings?.defaultOgImage || "/og-default.png";
                const t = seo.ogTitle || seo.metaTitle || art.title || "Judul artikel";
                const d = seo.ogDescription || seo.metaDescription || "";
                const host = (settings?.siteUrl || "rezz.studio").replace(/^https?:\/\//, "");
                return (
                  <>
                    <h5>Facebook / WhatsApp / LinkedIn</h5>
                    <div className="og-card fb"><div className="og-img"><img src={img} alt="" /></div><div className="og-b"><small>{host.toUpperCase()}</small><b>{t}</b><p>{d}</p></div></div>
                    <h5>X (Twitter) — summary_large_image</h5>
                    <div className="og-card tw"><div className="og-img"><img src={img} alt="" /></div><div className="og-b"><b>{t}</b><p>{d}</p><small>{host}</small></div></div>
                  </>
                );
              })()}
            </>
          )}

          {tab === "schema" && (
            <>
              <div className="field"><label htmlFor="stp">Tipe schema artikel</label>
                <select id="stp" value={seo.schemaType} onChange={(e) => setSeo({ schemaType: e.target.value })}>{["BlogPosting", "Article", "NewsArticle", "TechArticle"].map((t) => <option key={t}>{t}</option>)}</select>
                <small className="hint">BreadcrumbList ditambahkan otomatis. FAQPage aktif otomatis bila ada ≥2 heading berakhiran “?”.</small></div>
              <div className="code-head"><b>JSON-LD (dibuat otomatis)</b><button type="button" className="chip-btn" onClick={() => copy(schema)}><AIcon name="copy" size={13} /> Salin</button></div>
              <pre className="code-box">{schema}</pre>
              <a className="abtn ghost sm" href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer">Uji di Rich Results Test <AIcon name="external" size={13} /></a>
            </>
          )}

          {tab === "adv" && (
            <>
              <div className="field"><label htmlFor="cn">Canonical URL (opsional)</label><input id="cn" value={seo.canonical} onChange={(e) => setSeo({ canonical: e.target.value })} placeholder="Kosongkan = otomatis self-canonical" /><small className="hint">Isi hanya jika konten ini duplikat dari URL lain.</small></div>
              <label className="check block"><input type="checkbox" checked={seo.noindex} onChange={(e) => setSeo({ noindex: e.target.checked })} /> <span><b>Noindex</b> — jangan tampilkan di Google</span></label>
              <label className="check block"><input type="checkbox" checked={seo.nofollow} onChange={(e) => setSeo({ nofollow: e.target.checked })} /> <span><b>Nofollow</b> — jangan ikuti link di halaman ini</span></label>
              <p className="hint">Artikel noindex juga dikeluarkan dari sitemap.xml.</p>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
