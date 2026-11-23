"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "motion/react";
import AIcon from "@/components/admin/AIcon";
import { Empty, Modal, Spinner, StatusPill, Tags, useConfirm, useToast } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/MediaPicker";
import { api } from "@/lib/api";
import { parseVideo } from "@/lib/video";

const ARTS = [["neon", "Neon / Entertainment"], ["motion", "Motion / Sport"], ["temple", "Cinematic / Sunset"], ["drama", "Dramatic"], ["fun", "Fun / Lifestyle"], ["travel", "Travel"], ["persona", "Persona / Hospitality"]];
const blank = { title: "", category: "", subtitle: "", description: "", videoUrl: "", thumbnail: "", art: "neon", tags: [], status: "draft", featuredOnHome: true, isPersona: false, order: 99 };

function ProjectForm({ initial, onClose, onSaved }) {
  const toast = useToast();
  const [p, setP] = useState({ ...blank, ...initial });
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setP((x) => ({ ...x, [k]: v }));
  const ev = parseVideo(p.videoUrl);

  async function save(status) {
    if (!p.title.trim()) return toast.error("Judul wajib diisi");
    setBusy(true);
    try {
      const body = { ...p, status: status || p.status };
      const saved = p.id ? await api(`/api/admin/projects/${p.id}`, { method: "PUT", body }) : await api("/api/admin/projects", { method: "POST", body });
      toast(p.id ? "Project diperbarui" : "Project dibuat");
      onSaved(saved);
    } catch (e) { toast.error(e.message); setBusy(false); }
  }

  return (
    <Modal title={p.id ? "Edit Project" : "Tambah Project Baru"} onClose={onClose} size="lg"
      footer={<>
        <button className="abtn ghost" onClick={onClose}>Batal</button>
        <button className="abtn ghost" onClick={() => save("draft")} disabled={busy}>Simpan Draft</button>
        <button className="abtn grad" onClick={() => save("published")} disabled={busy}>{busy ? <Spinner size={14} /> : "Publish"}</button>
      </>}>
      <div className="form-grid">
        <div className="field span2"><label htmlFor="pt">Judul Project</label><input id="pt" value={p.title} onChange={(e) => set("title")(e.target.value)} placeholder="Mis. For Persona — Hospitality Edit" /></div>
        <div className="field"><label htmlFor="pc">Kategori</label><input id="pc" value={p.category} onChange={(e) => set("category")(e.target.value)} placeholder="Lifestyle / Hospitality" /></div>
        <div className="field"><label htmlFor="ps">Subjudul</label><input id="ps" value={p.subtitle} onChange={(e) => set("subtitle")(e.target.value)} placeholder="Social / Lifestyle" /></div>
        <div className="field span2">
          <label htmlFor="pv">Video (YouTube / Vimeo / MP4)</label>
          <input id="pv" value={p.videoUrl} onChange={(e) => set("videoUrl")(e.target.value)} placeholder="https://youtu.be/…  atau pilih dari library" />
          <small className="hint">{p.videoUrl ? (ev ? `✓ Terdeteksi: ${ev.type}` : "⚠ URL tidak dikenali (pakai YouTube, Vimeo, atau file .mp4)") : "Tempel link video, atau unggah MP4 di bawah."}</small>
          <ImageField type="video" value={p.videoUrl?.startsWith("/uploads/") ? p.videoUrl : ""} onChange={(u) => set("videoUrl")(u)} />
        </div>
        <div className="span2"><ImageField label="Thumbnail" value={p.thumbnail} onChange={set("thumbnail")} hint="Rasio 16:10 disarankan. Jika kosong, dipakai thumbnail YouTube atau visual gradient." /></div>
        <div className="field"><label htmlFor="pa">Visual cadangan</label><select id="pa" value={p.art} onChange={(e) => set("art")(e.target.value)}>{ARTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div className="field"><label htmlFor="po">Urutan</label><input id="po" type="number" min="1" value={p.order} onChange={(e) => set("order")(e.target.value)} /></div>
        <div className="field span2"><label htmlFor="pd">Deskripsi</label><textarea id="pd" rows={4} value={p.description} onChange={(e) => set("description")(e.target.value)} placeholder="Ceritakan konsep, peran, dan hasil project ini." /></div>
        <div className="field span2"><label>Tags</label><Tags value={p.tags} onChange={set("tags")} placeholder="hospitality, lifestyle…" /></div>
        <label className="check"><input type="checkbox" checked={p.featuredOnHome} onChange={(e) => set("featuredOnHome")(e.target.checked)} /> Tampilkan di Selected Edits (Home)</label>
        <label className="check"><input type="checkbox" checked={p.isPersona} onChange={(e) => set("isPersona")(e.target.checked)} /> Jadikan project “For Persona”</label>
      </div>
    </Modal>
  );
}

function PortfolioInner() {
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const sp = useSearchParams();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => api("/api/admin/projects").then(setItems).catch((e) => { toast.error(e.message); setItems([]); }), [toast]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (sp.get("new")) { setEditing({}); router.replace("/admin/portfolio"); } }, [sp, router]);

  async function remove(p) {
    if (!(await confirm({ title: "Hapus project?", message: `“${p.title}” akan dihapus permanen.`, danger: true, confirmLabel: "Hapus" }))) return;
    try { await api(`/api/admin/projects/${p.id}`, { method: "DELETE" }); toast("Project dihapus"); load(); } catch (e) { toast.error(e.message); }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Portfolio</h1><p className="muted">Karya yang tampil di Home → Selected Edits dan halaman Work.</p></div>
        <button className="abtn grad" onClick={() => setEditing({})}><AIcon name="plus" size={16} /> Add New Project</button>
      </div>
      {!items ? <div className="center-pad"><Spinner size={26} /></div> : items.length === 0 ? <div className="card"><Empty icon="portfolio" title="Belum ada project" /></div> : (
        <div className="proj-grid">
          {items.map((p) => (
            <article key={p.id} className="proj">
              <div className={`proj-th art-${p.art}`}>{p.thumbnail ? <img src={p.thumbnail} alt="" /> : <span className="proj-n">{String(p.order).padStart(2, "0")}</span>}<StatusPill status={p.status} /></div>
              <div className="proj-b">
                <b>{p.title}</b><small>{p.category}{p.subtitle ? ` · ${p.subtitle}` : ""}</small>
                <div className="proj-a">
                  <button className="abtn ghost sm" onClick={() => setEditing(p)}><AIcon name="edit" size={14} /> Edit</button>
                  <button className="icon-btn danger-text" onClick={() => remove(p)} aria-label={`Hapus ${p.title}`}><AIcon name="trash" size={16} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <AnimatePresence>{editing && <ProjectForm key={editing.id || "new"} initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}</AnimatePresence>
    </div>
  );
}

export default function PortfolioPage() { return <Suspense><PortfolioInner /></Suspense>; }
