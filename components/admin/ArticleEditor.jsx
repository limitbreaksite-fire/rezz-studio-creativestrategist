"use client";
import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AIcon from "./AIcon";
import Editor from "./Editor";
import SeoPanel from "./SeoPanel";
import { ImageField } from "./MediaPicker";
import { Spinner, StatusPill, Tags, useConfirm, useToast } from "./ui";
import { api } from "@/lib/api";
import { analyze, scoreColor } from "@/lib/seo/analyzer";
import { toAnalysisInput } from "@/lib/seo/input";
import { slugify } from "@/lib/seo/text";

const blank = () => ({
  id: null, title: "", slug: "", excerpt: "", content: "", status: "draft", category: "", tags: [], featuredImage: "", featuredAlt: "", author: "",
  publishedAt: null, updatedAt: null, slugTouched: false,
  seo: { focusKeyphrase: "", secondaryKeyphrases: [], metaTitle: "", metaDescription: "", canonical: "", noindex: false, nofollow: false, ogTitle: "", ogDescription: "", ogImage: "", schemaType: "BlogPosting" },
});

export default function ArticleEditor({ id }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const isNew = id === "new";
  const [art, setArtState] = useState(null);
  const [settings, setSettings] = useState(null);
  const [others, setOthers] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [side, setSide] = useState("seo"); // seo | doc
  const [mpane, setMpane] = useState("editor"); // editor | side (mobile)
  const [savedAt, setSavedAt] = useState(null);
  const editorRef = useRef(null);
  const artRef = useRef(null);

  /* ---------- load ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, list, a] = await Promise.all([api("/api/admin/settings"), api("/api/admin/articles"), isNew ? Promise.resolve(null) : api(`/api/admin/articles/${id}`)]);
        if (!alive) return;
        setSettings(s); setOthers(list);
        const base = a ? { ...blank(), ...a, seo: { ...blank().seo, ...a.seo }, slugTouched: true } : { ...blank(), author: s.authorName };
        setArtState(base);
        artRef.current = base;
      } catch (e) { toast.error(e.message); router.replace("/admin/articles"); }
    })();
    return () => { alive = false; };
  }, [id, isNew, router, toast]);

  const setArt = useCallback((patch) => {
    setArtState((a) => { const n = { ...a, ...(typeof patch === "function" ? patch(a) : patch) }; artRef.current = n; return n; });
    setDirty(true);
  }, []);
  const setSeo = useCallback((patch) => setArt((a) => ({ seo: { ...a.seo, ...patch } })), [setArt]);
  const onContent = useCallback((content) => setArt({ content }), [setArt]);

  /* ---------- analisis ---------- */
  const deferred = useDeferredValue(art);
  const analysis = useMemo(() => (deferred ? analyze(toAnalysisInput(deferred, settings || {}, others)) : null), [deferred, settings, others]);

  /* ---------- simpan ---------- */
  const save = useCallback(async (status) => {
    const a = artRef.current;
    if (!a?.title.trim()) { toast.error("Judul wajib diisi"); return; }
    setSaving(true);
    try {
      const body = { ...a, status: status || a.status };
      const saved = a.id ? await api(`/api/admin/articles/${a.id}`, { method: "PUT", body }) : await api("/api/admin/articles", { method: "POST", body });
      setArtState((cur) => { const n = { ...cur, id: saved.id, slug: saved.slug, status: saved.status, publishedAt: saved.publishedAt, updatedAt: saved.updatedAt }; artRef.current = n; return n; });
      setDirty(false); setSavedAt(new Date());
      toast(saved.status === "published" ? (status === "published" && !a.publishedAt ? "Artikel dipublikasikan 🎉" : "Perubahan disimpan") : "Draft disimpan");
      if (!a.id) window.history.replaceState(null, "", `/admin/articles/${saved.id}`);
      api("/api/admin/articles").then(setOthers).catch(() => {});
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  }, [toast]);

  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
    const onLeave = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("keydown", onKey); window.addEventListener("beforeunload", onLeave);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onLeave); };
  }, [save, dirty]);

  async function remove() {
    if (!art.id) return router.push("/admin/articles");
    if (!(await confirm({ title: "Hapus artikel?", message: "Artikel akan dihapus permanen.", danger: true, confirmLabel: "Hapus" }))) return;
    try { await api(`/api/admin/articles/${art.id}`, { method: "DELETE" }); setDirty(false); toast("Artikel dihapus"); router.replace("/admin/articles"); } catch (e) { toast.error(e.message); }
  }
  async function leave(e) {
    if (dirty && !(await confirm({ title: "Perubahan belum disimpan", message: "Keluar tanpa menyimpan?", confirmLabel: "Keluar" }))) e.preventDefault();
  }

  if (!art || !analysis) return <div className="center-pad"><Spinner size={28} /></div>;
  const color = scoreColor(analysis.score);
  const published = art.status === "published";

  const onTitle = (e) => {
    const title = e.target.value;
    setArt((a) => ({ title, ...(a.slugTouched ? {} : { slug: slugify(title) }) }));
  };

  return (
    <div className="ae" data-mpane={mpane}>
      <header className="ae-top">
        <Link href="/admin/articles" className="icon-btn" aria-label="Kembali ke daftar artikel" onClick={leave}><AIcon name="arrowLeft" size={20} /></Link>
        <div className="ae-state"><StatusPill status={art.status} /><small className="muted">{saving ? "Menyimpan…" : dirty ? "Belum disimpan" : savedAt ? `Tersimpan ${savedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : art.id ? "Tersimpan" : "Baru"}</small></div>
        <button className={`score-pill ${color}`} onClick={() => { setSide("seo"); setMpane("side"); }} title="Lihat analisis SEO"><AIcon name="bolt" size={14} /> SEO {analysis.score}</button>
        <div className="ae-actions">
          {published && art.id && <a href={`/articles/${art.slug}`} target="_blank" rel="noopener noreferrer" className="abtn ghost sm hide-sm"><AIcon name="eye" size={15} /> Lihat</a>}
          <button className="abtn ghost sm" onClick={() => save("draft")} disabled={saving}><AIcon name="save" size={15} /> <span className="hide-xs">{published ? "Jadikan Draft" : "Simpan Draft"}</span></button>
          <button className="abtn grad sm" onClick={() => save("published")} disabled={saving}>{saving ? <Spinner size={14} /> : published ? "Perbarui" : "Publish"}</button>
        </div>
      </header>

      <nav className="ae-mtabs" aria-label="Panel">
        {[["editor", "Editor", "edit"], ["seo", "SEO", "bolt"], ["doc", "Dokumen", "note"]].map(([k, l, ic]) => {
          const on = k === "editor" ? mpane === "editor" : mpane === "side" && side === k;
          return <button key={k} className={on ? "on" : ""} onClick={() => { if (k === "editor") setMpane("editor"); else { setSide(k); setMpane("side"); } }}><AIcon name={ic} size={15} /> {l}{k === "seo" && <i className={`dot ${color}`} />}</button>;
        })}
      </nav>

      <div className="ae-body">
        <section className="ae-main">
          <label className="sr-only" htmlFor="title">Judul artikel</label>
          <textarea id="title" className="ae-title" rows={1} value={art.title} onChange={onTitle} placeholder="Judul artikel…" onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }} />
          <div className="ae-permalink"><AIcon name="link" size={14} /><span>{(settings?.siteUrl || "").replace(/^https?:\/\//, "")}/articles/</span><b>{art.slug || "slug-artikel"}</b>
            <button className="chip-btn" onClick={() => { setSide("seo"); setMpane("side"); }}>Edit</button></div>
          <Editor ref={editorRef} value={art.content} onChange={onContent} title={art.title} featuredImage={art.featuredImage} author={art.author} articles={others.filter((o) => o.id !== art.id)} />
        </section>

        <aside className="ae-side" aria-label="Pengaturan artikel">
          <div className="side-tabs" role="tablist">
            <button role="tab" aria-selected={side === "seo"} className={side === "seo" ? "on" : ""} onClick={() => setSide("seo")}><AIcon name="bolt" size={15} /> SEO <i className={`dot ${color}`} /></button>
            <button role="tab" aria-selected={side === "doc"} className={side === "doc" ? "on" : ""} onClick={() => setSide("doc")}><AIcon name="note" size={15} /> Dokumen</button>
          </div>
          {side === "seo" ? (
            <SeoPanel art={art} setArt={setArt} setSeo={setSeo} analysis={analysis} settings={settings} onInsertLink={(href, text) => { editorRef.current?.insertLink(href, text); setMpane("editor"); toast("Link disisipkan di posisi kursor"); }} />
          ) : (
            <div className="doc">
              <div className="field"><label htmlFor="st">Status</label>
                <select id="st" value={art.status} onChange={(e) => setArt({ status: e.target.value })}><option value="draft">Draft</option><option value="published">Published</option></select>
                {art.publishedAt && <small className="hint">Dipublikasikan {new Date(art.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</small>}</div>
              <div className="field"><label htmlFor="cat">Kategori</label><input id="cat" list="cats" value={art.category} onChange={(e) => setArt({ category: e.target.value })} placeholder="mis. Editing Tips" />
                <datalist id="cats">{[...new Set(others.map((o) => o.category).filter(Boolean))].map((c) => <option key={c} value={c} />)}</datalist></div>
              <div className="field"><label>Tags</label><Tags value={art.tags} onChange={(tags) => setArt({ tags })} placeholder="premiere pro, transisi…" /></div>
              <ImageField label="Gambar utama" value={art.featuredImage} onChange={(u, m) => setArt((a) => ({ featuredImage: u, featuredAlt: a.featuredAlt || m?.alt || "" }))} hint="Tampil di daftar artikel, header artikel, OG, dan schema. Rasio 1200×630 disarankan." />
              {art.featuredImage && <div className="field"><label htmlFor="fa">Alt text gambar utama</label><input id="fa" value={art.featuredAlt} onChange={(e) => setArt({ featuredAlt: e.target.value })} placeholder="Deskripsikan gambar (+ keyphrase)" /></div>}
              <div className="field"><label htmlFor="ex">Ringkasan (excerpt)</label><textarea id="ex" rows={3} value={art.excerpt} onChange={(e) => setArt({ excerpt: e.target.value })} placeholder="Tampil di bawah judul & daftar artikel" /><small className="hint">{art.excerpt.length}/400</small></div>
              <div className="field"><label htmlFor="au">Penulis</label><input id="au" value={art.author} onChange={(e) => setArt({ author: e.target.value })} /></div>
              <button type="button" className="abtn ghost danger-text" onClick={remove}><AIcon name="trash" size={15} /> {art.id ? "Hapus artikel" : "Buang draft"}</button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
