"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AIcon from "@/components/admin/AIcon";
import { Spinner, useToast } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/MediaPicker";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const toast = useToast();
  const router = useRouter();
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api("/api/admin/settings").then(setS).catch((e) => toast.error(e.message)); }, [toast]);
  if (!s) return <div className="center-pad"><Spinner size={26} /></div>;

  const set = (k) => (e) => setS((x) => ({ ...x, [k]: e.target ? e.target.value : e }));
  const nest = (g, k) => (e) => setS((x) => ({ ...x, [g]: { ...x[g], [k]: e.target ? e.target.value : e } }));

  async function save(e) {
    e.preventDefault(); setBusy(true);
    try { setS(await api("/api/admin/settings", { method: "PUT", body: s })); toast("Pengaturan disimpan"); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  }
  async function logout() { await api("/api/admin/logout", { method: "POST" }).catch(() => {}); router.replace("/admin/login"); }

  return (
    <form className="page" onSubmit={save}>
      <div className="page-head">
        <div><h1>Settings</h1><p className="muted">Identitas website, default SEO, dan media sosial.</p></div>
        <button className="abtn grad" disabled={busy}>{busy ? <Spinner size={14} /> : <AIcon name="save" size={16} />} Simpan</button>
      </div>

      <section className="card"><h2 className="card-title">Umum</h2>
        <div className="form-grid">
          <div className="field"><label htmlFor="sn">Nama situs</label><input id="sn" value={s.siteName} onChange={set("siteName")} /></div>
          <div className="field"><label htmlFor="su">URL situs</label><input id="su" value={s.siteUrl} onChange={set("siteUrl")} placeholder="https://rezz.studio" /></div>
          <div className="field span2"><label htmlFor="st">Tagline</label><input id="st" value={s.tagline} onChange={set("tagline")} /></div>
          <div className="field"><label htmlFor="sl">Lokasi</label><input id="sl" value={s.location} onChange={set("location")} /></div>
          <div className="field"><label htmlFor="se">Email kontak</label><input id="se" type="email" value={s.email} onChange={set("email")} /></div>
          <div className="field"><label htmlFor="sg">Bahasa situs</label><select id="sg" value={s.language} onChange={set("language")}><option value="id">Indonesia (id)</option><option value="en">English (en)</option></select></div>
        </div>
      </section>

      <section className="card"><h2 className="card-title">SEO default</h2>
        <div className="form-grid">
          <div className="field span2"><label htmlFor="mt">Template judul halaman</label><input id="mt" value={s.metaTitleTemplate} onChange={set("metaTitleTemplate")} /><small className="hint">Gunakan <code>%title%</code> untuk judul halaman. Contoh: <code>%title% | Rezz</code></small></div>
          <div className="field span2"><label htmlFor="md">Meta description default</label><textarea id="md" rows={3} value={s.defaultMetaDescription} onChange={set("defaultMetaDescription")} /><small className="hint">{s.defaultMetaDescription.length} karakter (ideal 120–160)</small></div>
          <div className="span2"><ImageField label="Gambar sosial default (OG 1200×630)" value={s.images.ogImage} onChange={nest("images", "ogImage")} hint="Dipakai saat halaman tidak punya gambar sendiri. Default: /og-default.png" /></div>
        </div>
      </section>

      <section className="card"><h2 className="card-title">Penulis</h2>
        <div className="form-grid">
          <div className="field"><label htmlFor="an">Nama penulis default</label><input id="an" value={s.authorName} onChange={set("authorName")} /></div>
          <div className="field"><label htmlFor="au">URL profil penulis</label><input id="au" value={s.authorUrl} onChange={set("authorUrl")} placeholder="https://…" /></div>
        </div>
      </section>

      <section className="card"><h2 className="card-title">Foto website</h2>
        <div className="form-grid">
          <ImageField label="Potret di Home (About the Editor)" value={s.images.heroPortrait} onChange={nest("images", "heroPortrait")} hint="Rasio portrait disarankan (4:5)." />
          <ImageField label="Foto hero halaman About" value={s.images.aboutHero} onChange={nest("images", "aboutHero")} hint="Landscape, subjek di sisi kanan." />
        </div>
      </section>

      <section className="card"><h2 className="card-title">Media sosial</h2>
        <div className="form-grid">
          {["linkedin", "instagram", "youtube", "tiktok"].map((k) => (
            <div className="field" key={k}><label htmlFor={`so-${k}`}>{k[0].toUpperCase() + k.slice(1)}</label><input id={`so-${k}`} value={s.social[k]} onChange={nest("social", k)} placeholder="https://…" /></div>
          ))}
        </div>
      </section>

      <section className="card"><h2 className="card-title">Keamanan</h2>
        <p className="muted">Password dashboard diatur lewat variabel environment <code>ADMIN_PASSWORD</code> di server (bukan disimpan di database). Ubah di <code>.env.local</code> lalu restart server.</p>
        <button type="button" className="abtn ghost" onClick={logout}><AIcon name="logout" size={16} /> Keluar dari dashboard</button>
      </section>
    </form>
  );
}
