"use client";
// Editor artikel WYSIWYG ala WordPress — tanpa dependensi eksternal (contentEditable + execCommand).
// Fitur: Visual / HTML / Preview (desktop-tablet-mobile), H1–H4, bold/italic/underline/strike, list, quote, code,
// link (new tab / nofollow / saran internal link), gambar (library/upload/paste/drag-drop + alt, caption, align),
// video (YouTube/Vimeo/MP4), tabel (+ tools baris/kolom), garis horizontal, align, undo/redo, fullscreen.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import AIcon from "./AIcon";
import { Modal, useToast } from "./ui";
import MediaPicker, { uploadFiles } from "./MediaPicker";
import { sanitizeHtml } from "@/lib/sanitize";
import { renderArticleHtml, fmtDate } from "@/lib/renderContent";
import { parseVideo, videoHtml } from "@/lib/video";
import { words, stripTags } from "@/lib/seo/text";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const BLOCKS = [["p", "Paragraf"], ["h1", "Heading 1"], ["h2", "Heading 2"], ["h3", "Heading 3"], ["h4", "Heading 4"], ["blockquote", "Kutipan"], ["pre", "Kode"]];

function clean(html) {
  return html.replace(/\scontenteditable="(?:true|false)"/g, "").replace(/\sdata-sel="1"/g, "").replace(/<p><br><\/p>\s*$/g, "").trim();
}
function prepare(html) {
  const h = sanitizeHtml(html || "");
  return h.trim() ? h : "<p><br></p>";
}
function decorate(root) {
  root?.querySelectorAll(".video-embed, video, figure.media-figure img").forEach((n) => n.setAttribute("contenteditable", "false"));
}
function prettyHtml(html) {
  return html.replace(/(<\/(?:p|h[1-6]|ul|ol|li|table|thead|tbody|tr|blockquote|pre|figure|div)>|<hr>|<br>)/g, "$1\n").replace(/\n{2,}/g, "\n").trim();
}

const Editor = forwardRef(function Editor({ value, onChange, title, featuredImage, author, articles = [], onStats }, ref) {
  const toast = useToast();
  const ed = useRef(null);
  const range = useRef(null);
  const [mode, setMode] = useState("visual");
  const [device, setDevice] = useState("desktop");
  const [full, setFull] = useState(false);
  const [fmt, setFmt] = useState({});
  const [block, setBlock] = useState("p");
  const [inTable, setInTable] = useState(false);
  const [img, setImg] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [htmlDraft, setHtmlDraft] = useState("");
  const [html, setHtml] = useState(() => prepare(value));
  const [stats, setStats] = useState({ words: 0, chars: 0 });

  /* ------------ init & emit ------------ */
  useEffect(() => {
    if (mode !== "visual" || !ed.current) return;
    ed.current.innerHTML = prepare(html);
    decorate(ed.current);
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const emit = useCallback(() => {
    if (!ed.current) return;
    decorate(ed.current);
    const h = clean(ed.current.innerHTML);
    setHtml(h);
    onChange?.(h);
    const t = ed.current.innerText || "";
    const s = { words: words(t).length, chars: t.replace(/\s/g, "").length };
    setStats(s); onStats?.(s);
  }, [onChange, onStats]);

  useEffect(() => { const t = stripTags(value || ""); const s = { words: words(t).length, chars: t.replace(/\s/g, "").length }; setStats(s); onStats?.(s); /* eslint-disable-next-line */ }, []);

  /* ------------ selection ------------ */
  const inEditor = (n) => !!(n && ed.current && ed.current.contains(n.nodeType === 3 ? n.parentNode : n));
  const saveRange = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount && inEditor(sel.anchorNode)) range.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreRange = () => {
    ed.current?.focus();
    const sel = window.getSelection();
    if (range.current) { sel.removeAllRanges(); sel.addRange(range.current); }
    else { const r = document.createRange(); r.selectNodeContents(ed.current); r.collapse(false); sel.removeAllRanges(); sel.addRange(r); }
  };

  useEffect(() => {
    const onSel = () => {
      const sel = window.getSelection();
      if (!sel?.rangeCount || !inEditor(sel.anchorNode)) return;
      saveRange();
      const q = (c) => { try { return document.queryCommandState(c); } catch { return false; } };
      setFmt({ bold: q("bold"), italic: q("italic"), underline: q("underline"), strike: q("strikeThrough"), ul: q("insertUnorderedList"), ol: q("insertOrderedList"), left: q("justifyLeft"), center: q("justifyCenter"), right: q("justifyRight") });
      let el = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
      let b = "p";
      for (let n = el; n && n !== ed.current; n = n.parentElement) {
        const t = n.tagName?.toLowerCase();
        if (["h1", "h2", "h3", "h4", "blockquote", "pre"].includes(t)) { b = t; break; }
      }
      setBlock(b);
      setInTable(!!el?.closest?.("td, th") && inEditor(el));
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  /* ------------ perintah ------------ */
  const run = (fn) => { restoreRange(); fn(); emit(); saveRange(); };
  const exec = (cmd, val) => run(() => document.execCommand(cmd, false, val));
  const insertHTML = (h) => run(() => document.execCommand("insertHTML", false, h));
  const setBlockTag = (t) => exec("formatBlock", `<${block === t && t !== "p" ? "p" : t}>`);

  useImperativeHandle(ref, () => ({
    insertLink(href, text) {
      setMode("visual");
      setTimeout(() => { restoreRange(); document.execCommand("insertHTML", false, `<a href="${esc(href)}">${esc(text)}</a>&nbsp;`); emit(); }, 30);
    },
    focus() { ed.current?.focus(); },
  }));

  /* ------------ link ------------ */
  const openLink = () => {
    saveRange();
    const sel = window.getSelection();
    const a = sel?.anchorNode && (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode)?.closest?.("a");
    setDialog({ type: "link", href: a?.getAttribute("href") || "", text: sel?.toString() || "", newTab: a?.target === "_blank", nofollow: /nofollow/.test(a?.rel || ""), hasSel: !!sel?.toString() || !!a });
  };
  const applyLink = ({ href, text, newTab, nofollow }) => {
    run(() => {
      const sel = window.getSelection();
      const rel = [newTab && "noopener", nofollow && "nofollow"].filter(Boolean).join(" ");
      if (sel.isCollapsed) {
        document.execCommand("insertHTML", false, `<a href="${esc(href)}"${newTab ? ' target="_blank"' : ""}${rel ? ` rel="${rel}"` : ""}>${esc(text || href)}</a>&nbsp;`);
      } else {
        document.execCommand("createLink", false, href);
        ed.current.querySelectorAll("a").forEach((a) => {
          if (a.getAttribute("href") !== href) return;
          newTab ? a.setAttribute("target", "_blank") : a.removeAttribute("target");
          rel ? a.setAttribute("rel", rel) : a.removeAttribute("rel");
        });
      }
    });
    setDialog(null);
  };

  /* ------------ gambar ------------ */
  const insertImage = ({ src, alt, caption, align }) => {
    insertHTML(`<figure class="media-figure${align && align !== "full" ? ` align-${align}` : ""}"><img src="${esc(src)}" alt="${esc(alt)}">${caption ? `<figcaption>${esc(caption)}</figcaption>` : ""}</figure><p><br></p>`);
    setDialog(null);
  };
  async function uploadAndInsert(files) {
    try {
      toast("Mengunggah gambar…");
      const out = await uploadFiles(files);
      restoreRange();
      for (const m of out) document.execCommand("insertHTML", false, `<figure class="media-figure"><img src="${esc(m.url)}" alt="${esc(m.alt || "")}"></figure><p><br></p>`);
      emit();
      toast("Gambar disisipkan — jangan lupa isi alt text");
    } catch (e) { toast.error(e.message); }
  }

  const onEditorClick = (e) => {
    ed.current.querySelectorAll("img[data-sel]").forEach((i) => i.removeAttribute("data-sel"));
    if (e.target.tagName === "IMG") {
      e.target.setAttribute("data-sel", "1");
      const fig = e.target.closest("figure");
      const align = ["left", "center", "right"].find((a) => fig?.classList.contains(`align-${a}`)) || "full";
      setImg({ el: e.target, alt: e.target.getAttribute("alt") || "", align });
    } else setImg(null);
  };
  const imgAlt = (v) => { img.el.setAttribute("alt", v); setImg({ ...img, alt: v }); emit(); };
  const imgAlign = (a) => {
    let fig = img.el.closest("figure");
    if (!fig) { fig = document.createElement("figure"); fig.className = "media-figure"; img.el.replaceWith(fig); fig.appendChild(img.el); }
    ["left", "center", "right"].forEach((x) => fig.classList.remove(`align-${x}`));
    if (a !== "full") fig.classList.add(`align-${a}`);
    setImg({ ...img, align: a }); emit();
  };
  const imgRemove = () => { (img.el.closest("figure") || img.el).remove(); setImg(null); emit(); };

  /* ------------ tabel ------------ */
  const insertTable = ({ rows, cols, header }) => {
    const cell = (t) => `<${t}><br></${t}>`;
    let h = "<table>";
    if (header) h += `<thead><tr>${Array.from({ length: cols }, () => cell("th")).join("")}</tr></thead>`;
    h += "<tbody>" + Array.from({ length: Math.max(1, rows - (header ? 1 : 0)) }, () => `<tr>${Array.from({ length: cols }, () => cell("td")).join("")}</tr>`).join("") + "</tbody></table><p><br></p>";
    insertHTML(h);
    setDialog(null);
  };
  const tableOp = (op) => {
    const sel = window.getSelection();
    const el = sel?.anchorNode?.nodeType === 3 ? sel.anchorNode.parentElement : sel?.anchorNode;
    const cell = el?.closest?.("td, th");
    if (!cell || !inEditor(cell)) return;
    const row = cell.parentElement, table = cell.closest("table"), idx = cell.cellIndex;
    const mk = (tag) => { const c = document.createElement(tag); c.innerHTML = "<br>"; return c; };
    if (op === "rowAbove" || op === "rowBelow") {
      const nr = document.createElement("tr");
      [...row.cells].forEach(() => nr.appendChild(mk("td")));
      row.parentNode.insertBefore(nr, op === "rowAbove" ? row : row.nextSibling);
    } else if (op === "colLeft" || op === "colRight") {
      [...table.rows].forEach((tr) => { const ref = tr.cells[idx]; if (ref) tr.insertBefore(mk(ref.tagName.toLowerCase()), op === "colLeft" ? ref : ref.nextSibling); });
    } else if (op === "delRow") { table.rows.length > 1 ? row.remove() : table.remove(); }
    else if (op === "delCol") { row.cells.length > 1 ? [...table.rows].forEach((tr) => tr.cells[idx]?.remove()) : table.remove(); }
    else if (op === "delTable") table.remove();
    emit();
  };

  /* ------------ event editor ------------ */
  const onPaste = (e) => {
    const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith("image/"));
    if (files.length) { e.preventDefault(); uploadAndInsert(files); return; }
    const h = e.clipboardData?.getData("text/html");
    if (h) {
      e.preventDefault();
      const body = (h.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, h])[1].replace(/<!--[\s\S]*?-->/g, "");
      document.execCommand("insertHTML", false, sanitizeHtml(body).replace(/<(\/?)b\b[^>]*font-weight:\s*normal[^>]*>/gi, ""));
      emit();
    }
  };
  const onDrop = (e) => {
    const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith("image/"));
    if (files.length) { e.preventDefault(); uploadAndInsert(files); }
  };
  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openLink(); }
    if (e.key === "Tab" && inTable) {
      e.preventDefault();
      const sel = window.getSelection();
      const cell = (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode).closest("td, th");
      const cells = [...cell.closest("table").querySelectorAll("td, th")];
      const next = cells[cells.indexOf(cell) + (e.shiftKey ? -1 : 1)];
      if (next) { const r = document.createRange(); r.selectNodeContents(next); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); }
    }
  };

  /* ------------ mode ------------ */
  function switchMode(m) {
    if (m === mode) return;
    if (mode === "visual") { emit(); saveRange(); }
    if (mode === "html") { const h = prepare(htmlDraft); setHtml(h); onChange?.(clean(h)); }
    if (m === "html") setHtmlDraft(prettyHtml(clean(ed.current?.innerHTML || html)));
    setMode(m);
  }
  useEffect(() => { document.body.classList.toggle("editor-full", full); return () => document.body.classList.remove("editor-full"); }, [full]);

  const preview = useMemo(() => (mode === "preview" ? renderArticleHtml(html) : null), [mode, html]);

  /* ------------ UI ------------ */
  const Btn = ({ icon, label, onClick, active, disabled }) => (
    <button type="button" className={`tb ${active ? "on" : ""}`} title={label} aria-label={label} aria-pressed={active ?? undefined} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={onClick}><AIcon name={icon} size={17} /></button>
  );
  const Sep = () => <span className="tb-sep" aria-hidden="true" />;

  return (
    <div className={`editor ${full ? "full" : ""}`}>
      <div className="ed-bar">
        <div className="ed-tabs" role="tablist" aria-label="Mode editor">
          {[["visual", "Visual", "edit"], ["html", "HTML", "html"], ["preview", "Preview", "eye"]].map(([k, l, ic]) => (
            <button key={k} role="tab" aria-selected={mode === k} className={mode === k ? "on" : ""} onClick={() => switchMode(k)}><AIcon name={ic} size={14} /> {l}</button>
          ))}
        </div>
        {mode === "preview" && (
          <div className="ed-devices">{[["desktop", "desktop"], ["tablet", "tablet"], ["mobile", "phone"]].map(([k, ic]) => <button key={k} className={device === k ? "on" : ""} onClick={() => setDevice(k)} aria-label={k} title={k}><AIcon name={ic} size={16} /></button>)}</div>
        )}
        <button type="button" className="tb right" title={full ? "Keluar fullscreen" : "Fullscreen"} aria-label="Fullscreen" onClick={() => setFull((v) => !v)}><AIcon name="fullscreen" size={17} /></button>
      </div>

      {mode === "visual" && (
        <div className="ed-toolbar" role="toolbar" aria-label="Format teks">
          <select className="tb-select" value={block} aria-label="Gaya blok" onChange={(e) => { restoreRange(); const t = e.target.value; document.execCommand("formatBlock", false, `<${t}>`); emit(); }}>
            {BLOCKS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <Sep />
          <Btn icon="bold" label="Tebal (Ctrl+B)" active={fmt.bold} onClick={() => exec("bold")} />
          <Btn icon="italic" label="Miring (Ctrl+I)" active={fmt.italic} onClick={() => exec("italic")} />
          <Btn icon="underline" label="Garis bawah (Ctrl+U)" active={fmt.underline} onClick={() => exec("underline")} />
          <Btn icon="strike" label="Coret" active={fmt.strike} onClick={() => exec("strikeThrough")} />
          <Sep />
          <Btn icon="ul" label="Daftar poin" active={fmt.ul} onClick={() => exec("insertUnorderedList")} />
          <Btn icon="ol" label="Daftar nomor" active={fmt.ol} onClick={() => exec("insertOrderedList")} />
          <Btn icon="quote" label="Kutipan" active={block === "blockquote"} onClick={() => setBlockTag("blockquote")} />
          <Btn icon="code" label="Blok kode" active={block === "pre"} onClick={() => setBlockTag("pre")} />
          <Sep />
          <Btn icon="link" label="Sisipkan link (Ctrl+K)" onClick={openLink} />
          <Btn icon="unlink" label="Hapus link" onClick={() => exec("unlink")} />
          <Sep />
          <Btn icon="image" label="Sisipkan gambar" onClick={() => { saveRange(); setDialog({ type: "image" }); }} />
          <Btn icon="video" label="Sisipkan video" onClick={() => { saveRange(); setDialog({ type: "video" }); }} />
          <Btn icon="table" label="Sisipkan tabel" onClick={() => { saveRange(); setDialog({ type: "table" }); }} />
          <Btn icon="hr" label="Garis horizontal" onClick={() => insertHTML("<hr><p><br></p>")} />
          <Sep />
          <Btn icon="alignL" label="Rata kiri" active={fmt.left} onClick={() => exec("justifyLeft")} />
          <Btn icon="alignC" label="Rata tengah" active={fmt.center} onClick={() => exec("justifyCenter")} />
          <Btn icon="alignR" label="Rata kanan" active={fmt.right} onClick={() => exec("justifyRight")} />
          <Sep />
          <Btn icon="undo" label="Urungkan (Ctrl+Z)" onClick={() => exec("undo")} />
          <Btn icon="redo" label="Ulangi (Ctrl+Y)" onClick={() => exec("redo")} />
          <Btn icon="clear" label="Hapus format" onClick={() => { exec("removeFormat"); exec("unlink"); }} />
        </div>
      )}

      {mode === "visual" && inTable && (
        <div className="ed-subtools" role="toolbar" aria-label="Alat tabel">
          <span>Tabel</span>
          <Btn icon="rowAbove" label="Baris di atas" onClick={() => tableOp("rowAbove")} />
          <Btn icon="rowBelow" label="Baris di bawah" onClick={() => tableOp("rowBelow")} />
          <Btn icon="colLeft" label="Kolom di kiri" onClick={() => tableOp("colLeft")} />
          <Btn icon="colRight" label="Kolom di kanan" onClick={() => tableOp("colRight")} />
          <button type="button" className="chip-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => tableOp("delRow")}>Hapus baris</button>
          <button type="button" className="chip-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => tableOp("delCol")}>Hapus kolom</button>
          <button type="button" className="chip-btn danger-text" onMouseDown={(e) => e.preventDefault()} onClick={() => tableOp("delTable")}>Hapus tabel</button>
        </div>
      )}
      {mode === "visual" && img && (
        <div className="ed-subtools" role="toolbar" aria-label="Alat gambar">
          <span>Gambar</span>
          <input className="mini-input" value={img.alt} onChange={(e) => imgAlt(e.target.value)} placeholder="Alt text (wajib untuk SEO)" aria-label="Alt text gambar" />
          {[["left", "alignL", "Float kiri"], ["center", "alignC", "Tengah"], ["right", "alignR", "Float kanan"]].map(([k, ic, l]) => <Btn key={k} icon={ic} label={l} active={img.align === k} onClick={() => imgAlign(k)} />)}
          <button type="button" className={`chip-btn ${img.align === "full" ? "on" : ""}`} onClick={() => imgAlign("full")}>Lebar penuh</button>
          <button type="button" className="chip-btn danger-text" onClick={imgRemove}>Hapus</button>
        </div>
      )}

      <div className="ed-surface-wrap">
        {mode === "visual" && (
          <div ref={ed} className="ed-surface prose" contentEditable suppressContentEditableWarning spellCheck lang="id" role="textbox" aria-multiline="true" aria-label="Isi artikel"
            data-placeholder="Mulai menulis artikel di sini… Tekan Enter untuk paragraf baru, atau pakai toolbar untuk heading, gambar, tabel, dan video."
            onInput={emit} onBlur={saveRange} onClick={onEditorClick} onPaste={onPaste} onDrop={onDrop} onKeyDown={onKeyDown} onKeyUp={saveRange} onMouseUp={saveRange} />
        )}
        {mode === "html" && (
          <>
            <textarea className="ed-html" value={htmlDraft} onChange={(e) => setHtmlDraft(e.target.value)} spellCheck={false} aria-label="Kode HTML artikel" />
            <p className="hint pad">Mode HTML: script, event handler, dan tag berbahaya otomatis dibersihkan saat kembali ke Visual / saat disimpan.</p>
          </>
        )}
        {mode === "preview" && preview && (
          <div className={`pv-frame ${device}`}>
            <article className="pv-site article">
              <header className="article-head">
                <h1>{title || "Judul artikel"}</h1>
                <p className="article-meta">{author || "Rezz"} · {fmtDate(new Date())} · {Math.max(1, Math.round(stats.words / 200))} menit baca</p>
              </header>
              {featuredImage && <figure className="article-cover"><img src={featuredImage} alt="" /></figure>}
              {preview.toc.length >= 3 && (
                <aside className="toc inline"><b>Daftar isi</b><ol>{preview.toc.map((t) => <li key={t.id} className={`l${t.level}`}><a href={`#${t.id}`} onClick={(e) => e.preventDefault()}>{t.text}</a></li>)}</ol></aside>
              )}
              <div className="prose" dangerouslySetInnerHTML={{ __html: preview.html }} />
            </article>
          </div>
        )}
      </div>

      <div className="ed-status"><span>{stats.words} kata</span><span>{stats.chars} karakter</span><span>±{Math.max(1, Math.round(stats.words / 200))} menit baca</span>{mode === "visual" && <span className="ed-hint">Ctrl+K link · Ctrl+S simpan · tempel/seret gambar langsung</span>}</div>

      <AnimatePresence>
        {dialog?.type === "link" && <LinkDialog init={dialog} articles={articles} onClose={() => setDialog(null)} onApply={applyLink} />}
        {dialog?.type === "image" && <ImageDialog onClose={() => setDialog(null)} onInsert={insertImage} />}
        {dialog?.type === "video" && <VideoDialog onClose={() => setDialog(null)} onInsert={(url) => { insertHTML(videoHtml(url)); setDialog(null); }} />}
        {dialog?.type === "table" && <TableDialog onClose={() => setDialog(null)} onInsert={insertTable} />}
      </AnimatePresence>
    </div>
  );
});
export default Editor;

/* ============================ dialog ============================ */
function LinkDialog({ init, articles, onClose, onApply }) {
  const [href, setHref] = useState(init.href);
  const [text, setText] = useState(init.text);
  const [newTab, setNewTab] = useState(init.newTab);
  const [nofollow, setNofollow] = useState(init.nofollow);
  const [q, setQ] = useState("");
  const matches = articles.filter((a) => a.status === "published" && (!q || a.title.toLowerCase().includes(q.toLowerCase()))).slice(0, 5);
  const ext = /^https?:\/\//i.test(href);
  return (
    <Modal title="Sisipkan link" onClose={onClose}
      footer={<><button className="abtn ghost" onClick={onClose}>Batal</button><button className="abtn primary" disabled={!href.trim()} onClick={() => onApply({ href: href.trim(), text, newTab, nofollow })}>Terapkan</button></>}>
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); href.trim() && onApply({ href: href.trim(), text, newTab, nofollow }); }}>
        <div className="field span2"><label htmlFor="lk">URL</label><input id="lk" value={href} onChange={(e) => setHref(e.target.value)} placeholder="https://… atau /articles/slug" /></div>
        {!init.hasSel && <div className="field span2"><label htmlFor="lt">Teks link</label><input id="lt" value={text} onChange={(e) => setText(e.target.value)} placeholder="Teks yang tampil (anchor text deskriptif)" /></div>}
        <label className="check"><input type="checkbox" checked={newTab} onChange={(e) => { setNewTab(e.target.checked); }} /> Buka di tab baru</label>
        <label className="check"><input type="checkbox" checked={nofollow} onChange={(e) => setNofollow(e.target.checked)} /> Nofollow {ext ? "" : "(untuk link luar)"}</label>
        <div className="field span2">
          <label htmlFor="lq">Link ke artikel sendiri (internal link)</label>
          <input id="lq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari artikel…" />
          <ul className="pick-list">{matches.length ? matches.map((a) => <li key={a.id}><button type="button" onClick={() => { setHref(`/articles/${a.slug}`); if (!init.hasSel && !text) setText(a.title); }}><b>{a.title}</b><small>/articles/{a.slug}</small></button></li>) : <li className="muted small">Tidak ada artikel published yang cocok.</li>}</ul>
        </div>
      </form>
    </Modal>
  );
}

function ImageDialog({ onClose, onInsert }) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [align, setAlign] = useState("full");
  const [pick, setPick] = useState(false);
  return (
    <>
      <Modal title="Sisipkan gambar" onClose={onClose}
        footer={<><button className="abtn ghost" onClick={onClose}>Batal</button><button className="abtn primary" disabled={!src} onClick={() => onInsert({ src, alt, caption, align })}>Sisipkan</button></>}>
        <div className="form-grid">
          <div className="field span2">
            <div className="img-drop" onClick={() => setPick(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setPick(true)}>
              {src ? <img src={src} alt="" /> : <><AIcon name="image" size={26} /><b>Pilih dari Media Library / unggah</b></>}
            </div>
          </div>
          <div className="field span2"><label htmlFor="iu">atau tempel URL gambar</label><input id="iu" value={src} onChange={(e) => setSrc(e.target.value)} placeholder="https://… atau /uploads/…" /></div>
          <div className="field span2"><label htmlFor="ia">Alt text <small className="hint inline">(deskripsikan gambar; masukkan keyphrase bila relevan)</small></label><input id="ia" value={alt} onChange={(e) => setAlt(e.target.value)} /></div>
          <div className="field span2"><label htmlFor="ic">Caption (opsional)</label><input id="ic" value={caption} onChange={(e) => setCaption(e.target.value)} /></div>
          <div className="field span2"><label>Perataan</label><div className="seg">{[["full", "Lebar penuh"], ["left", "Float kiri"], ["center", "Tengah"], ["right", "Float kanan"]].map(([k, l]) => <button type="button" key={k} className={align === k ? "on" : ""} onClick={() => setAlign(k)}>{l}</button>)}</div></div>
        </div>
      </Modal>
      {pick && <MediaPicker onClose={() => setPick(false)} onSelect={(m) => { setSrc(m.url); if (!alt) setAlt(m.alt || ""); setPick(false); }} />}
    </>
  );
}

function VideoDialog({ onClose, onInsert }) {
  const [url, setUrl] = useState("");
  const [pick, setPick] = useState(false);
  const v = parseVideo(url);
  return (
    <>
      <Modal title="Sisipkan video" onClose={onClose}
        footer={<><button className="abtn ghost" onClick={onClose}>Batal</button><button className="abtn primary" disabled={!v} onClick={() => onInsert(url)}>Sisipkan</button></>}>
        <div className="form-grid">
          <div className="field span2"><label htmlFor="vu">URL video (YouTube, Vimeo, atau file MP4)</label><input id="vu" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
            <small className="hint">{url ? (v ? `✓ Terdeteksi: ${v.type}` : "⚠ URL tidak dikenali") : "Embed YouTube memakai youtube-nocookie.com (lebih privat)."}</small></div>
          <div className="span2"><button type="button" className="abtn ghost" onClick={() => setPick(true)}><AIcon name="video" size={16} /> Pilih / unggah video dari library</button></div>
          {v && (
            <div className="span2 vid-prev">
              {v.type === "file" ? <video src={v.src} controls /> : v.thumb ? <img src={v.thumb} alt="Thumbnail video" /> : <p className="muted">Pratinjau tersedia setelah disisipkan.</p>}
            </div>
          )}
        </div>
      </Modal>
      {pick && <MediaPicker type="video" onClose={() => setPick(false)} onSelect={(m) => { setUrl(m.url); setPick(false); }} />}
    </>
  );
}

function TableDialog({ onClose, onInsert }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [header, setHeader] = useState(true);
  const clamp = (v, max) => Math.max(1, Math.min(max, parseInt(v, 10) || 1));
  return (
    <Modal title="Sisipkan tabel" onClose={onClose} size="sm"
      footer={<><button className="abtn ghost" onClick={onClose}>Batal</button><button className="abtn primary" onClick={() => onInsert({ rows, cols, header })}>Sisipkan</button></>}>
      <div className="form-grid">
        <div className="field"><label htmlFor="tr">Baris</label><input id="tr" type="number" min="1" max="30" value={rows} onChange={(e) => setRows(clamp(e.target.value, 30))} /></div>
        <div className="field"><label htmlFor="tc">Kolom</label><input id="tc" type="number" min="1" max="10" value={cols} onChange={(e) => setCols(clamp(e.target.value, 10))} /></div>
        <label className="check span2"><input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} /> Baris pertama sebagai header</label>
        <div className="span2 tbl-prev" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>{Array.from({ length: Math.min(rows, 6) * cols }, (_, i) => <i key={i} className={header && i < cols ? "h" : ""} />)}</div>
      </div>
    </Modal>
  );
}
