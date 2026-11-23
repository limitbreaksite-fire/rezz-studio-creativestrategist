"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Spinner, useToast } from "./ui";
import AIcon from "./AIcon";
import { api, fmtBytes } from "@/lib/api";

// Unggah file ke /api/admin/media
export async function uploadFiles(files) {
  const form = new FormData();
  for (const f of files) form.append("file", f);
  return api("/api/admin/media", { method: "POST", form });
}

export function MediaThumb({ item, onClick, selected, children }) {
  return (
    <button type="button" className={`m-item ${selected ? "selected" : ""}`} onClick={onClick}>
      {item.type === "video" ? <video src={item.url} preload="metadata" muted /> : <img src={item.url} alt={item.alt || item.name} loading="lazy" />}
      {item.type === "video" && <span className="m-badge"><AIcon name="video" size={12} /> Video</span>}
      <span className="m-name">{item.name}</span>
      {children}
    </button>
  );
}

/** Modal pemilih media. type: "image" | "video" | "any" */
export default function MediaPicker({ type = "image", onSelect, onClose, title }) {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef(null);

  const load = useCallback(async () => { try { setItems(await api("/api/admin/media")); } catch (e) { toast.error(e.message); setItems([]); } }, [toast]);
  useEffect(() => { load(); }, [load]);

  async function upload(files) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const out = await uploadFiles(files);
      toast(`${out.length} file terunggah`);
      await load();
      if (out.length === 1) onSelect(out[0]);
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }

  const list = (items || []).filter((m) => type === "any" || m.type === type);
  const accept = type === "image" ? "image/*" : type === "video" ? "video/mp4,video/webm" : "image/*,video/mp4,video/webm";

  return (
    <Modal title={title || (type === "video" ? "Pilih video" : "Pilih gambar")} onClose={onClose} size="lg">
      <div className={`dropzone ${drag ? "drag" : ""}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); upload([...e.dataTransfer.files]); }}>
        <AIcon name="upload" size={22} />
        <div><b>Seret & lepas file ke sini</b><small>{type === "video" ? "MP4 / WEBM" : "JPG, PNG, WEBP, GIF, AVIF"} — maks. 100MB</small></div>
        <button className="abtn primary sm" onClick={() => input.current?.click()} disabled={busy}>{busy ? <Spinner size={14} /> : "Unggah"}</button>
        <input ref={input} type="file" accept={accept} multiple hidden onChange={(e) => { upload([...e.target.files]); e.target.value = ""; }} />
      </div>
      {!items ? <div className="center-pad"><Spinner size={26} /></div> : list.length === 0 ? <p className="muted center-pad">Belum ada {type === "video" ? "video" : "gambar"} di library.</p> : (
        <div className="m-grid">
          {list.map((m) => <MediaThumb key={m.id} item={m} onClick={() => onSelect(m)}><small className="m-size">{fmtBytes(m.size)}</small></MediaThumb>)}
        </div>
      )}
    </Modal>
  );
}

/** Field gambar: tombol pilih + preview + hapus */
export function ImageField({ label, value, onChange, hint, type = "image" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="img-field">
        <div className="img-field-prev">{value ? (type === "video" ? <video src={value} muted /> : <img src={value} alt="" />) : <AIcon name={type === "video" ? "video" : "image"} size={22} />}</div>
        <div className="img-field-actions">
          <button type="button" className="abtn ghost sm" onClick={() => setOpen(true)}>{value ? "Ganti" : "Pilih"} {type === "video" ? "video" : "gambar"}</button>
          {value && <button type="button" className="abtn ghost sm danger-text" onClick={() => onChange("")}>Hapus</button>}
        </div>
      </div>
      {hint && <small className="hint">{hint}</small>}
      {open && <MediaPicker type={type} onClose={() => setOpen(false)} onSelect={(m) => { onChange(m.url, m); setOpen(false); }} />}
    </div>
  );
}
