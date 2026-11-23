"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import AIcon from "@/components/admin/AIcon";
import { Empty, Modal, Spinner, useConfirm, useToast } from "@/components/admin/ui";
import { MediaThumb, uploadFiles } from "@/components/admin/MediaPicker";
import { api, fmtBytes, fmtDateTime } from "@/lib/api";

export default function MediaPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState(null);
  const [sel, setSel] = useState(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [filter, setFilter] = useState("all");
  const input = useRef(null);

  const load = useCallback(() => api("/api/admin/media").then(setItems).catch((e) => { toast.error(e.message); setItems([]); }), [toast]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => setAlt(sel?.alt || ""), [sel]);

  async function upload(files) {
    if (!files?.length) return;
    setBusy(true);
    try { const out = await uploadFiles(files); toast(`${out.length} file terunggah`); await load(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function saveAlt() {
    try { const m = await api(`/api/admin/media/${sel.id}`, { method: "PUT", body: { alt } }); setSel(m); toast("Alt text disimpan"); load(); } catch (e) { toast.error(e.message); }
  }
  async function remove() {
    if (!(await confirm({ title: "Hapus file?", message: "File akan dihapus permanen. Artikel yang memakainya akan kehilangan gambar.", danger: true, confirmLabel: "Hapus" }))) return;
    try { await api(`/api/admin/media/${sel.id}`, { method: "DELETE" }); toast("File dihapus"); setSel(null); load(); } catch (e) { toast.error(e.message); }
  }
  const copy = async (t) => { try { await navigator.clipboard.writeText(location.origin + t); toast("URL disalin"); } catch { toast.error("Gagal menyalin"); } };

  const list = (items || []).filter((m) => filter === "all" || m.type === filter);
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Media Library</h1><p className="muted">Semua gambar & video yang diunggah.</p></div>
        <button className="abtn grad" onClick={() => input.current?.click()} disabled={busy}>{busy ? <Spinner size={14} /> : <AIcon name="upload" size={16} />} Unggah File</button>
        <input ref={input} type="file" multiple hidden accept="image/*,video/mp4,video/webm" onChange={(e) => { upload([...e.target.files]); e.target.value = ""; }} />
      </div>
      <div className="toolbar"><div className="seg">{[["all", "Semua"], ["image", "Gambar"], ["video", "Video"]].map(([k, l]) => <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>)}</div></div>
      <div className={`dropzone big ${drag ? "drag" : ""}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); upload([...e.dataTransfer.files]); }}>
        <AIcon name="upload" size={24} /><div><b>Seret & lepas file di sini</b><small>JPG, PNG, WEBP, GIF, AVIF, MP4, WEBM — maks. 100MB per file</small></div>
      </div>
      {!items ? <div className="center-pad"><Spinner size={26} /></div> : list.length === 0 ? <div className="card"><Empty icon="media" title="Library masih kosong" /></div> : (
        <div className="m-grid">{list.map((m) => <MediaThumb key={m.id} item={m} onClick={() => setSel(m)} selected={sel?.id === m.id} />)}</div>
      )}
      <AnimatePresence>
        {sel && (
          <Modal title="Detail media" onClose={() => setSel(null)} footer={<><button className="abtn ghost danger-text" onClick={remove}><AIcon name="trash" size={15} /> Hapus</button><button className="abtn primary" onClick={saveAlt}>Simpan alt text</button></>}>
            <div className="m-detail">
              <div className="m-prev">{sel.type === "video" ? <video src={sel.url} controls /> : <img src={sel.url} alt={sel.alt || sel.name} />}</div>
              <dl>
                <dt>Nama</dt><dd>{sel.name}</dd>
                <dt>Ukuran</dt><dd>{fmtBytes(sel.size)} · {sel.mime}</dd>
                <dt>Diunggah</dt><dd>{fmtDateTime(sel.createdAt)}</dd>
                <dt>URL</dt><dd className="url"><code>{sel.url}</code><button className="icon-btn" onClick={() => copy(sel.url)} aria-label="Salin URL"><AIcon name="copy" size={15} /></button></dd>
              </dl>
              {sel.type === "image" && <div className="field"><label htmlFor="malt">Alt text (penting untuk SEO & aksesibilitas)</label><input id="malt" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Deskripsikan isi gambar" /></div>}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
