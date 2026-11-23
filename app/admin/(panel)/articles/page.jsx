"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AIcon from "@/components/admin/AIcon";
import { Empty, ScoreDot, Spinner, StatusPill, useConfirm, useToast } from "@/components/admin/ui";
import { api, fmtDateTime } from "@/lib/api";

export default function ArticlesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const load = useCallback(() => api("/api/admin/articles").then(setItems).catch((e) => { toast.error(e.message); setItems([]); }), [toast]);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({ all: items?.length || 0, published: items?.filter((a) => a.status === "published").length || 0, draft: items?.filter((a) => a.status === "draft").length || 0 }), [items]);
  const list = (items || []).filter((a) => (tab === "all" || a.status === tab) && (!q || `${a.title} ${a.category} ${(a.tags || []).join(" ")}`.toLowerCase().includes(q.toLowerCase())));

  async function remove(a) {
    if (!(await confirm({ title: "Hapus artikel?", message: `“${a.title}” akan dihapus permanen.`, danger: true, confirmLabel: "Hapus" }))) return;
    try { await api(`/api/admin/articles/${a.id}`, { method: "DELETE" }); toast("Artikel dihapus"); load(); } catch (e) { toast.error(e.message); }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Artikel</h1><p className="muted">Kelola semua artikel di website kamu.</p></div>
        <Link href="/admin/articles/new" className="abtn grad"><AIcon name="plus" size={16} /> Tulis Artikel Baru</Link>
      </div>
      <div className="toolbar">
        <div className="seg">{[["all", "Semua"], ["published", "Published"], ["draft", "Draft"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l} <small>({counts[k]})</small></button>)}</div>
        <label className="search"><AIcon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari artikel…" aria-label="Cari artikel" /></label>
      </div>

      {!items ? <div className="center-pad"><Spinner size={26} /></div> : list.length === 0 ? (
        <div className="card"><Empty icon="articles" title={q ? "Tidak ada hasil" : "Belum ada artikel"}>{!q && <Link href="/admin/articles/new" className="abtn primary">Tulis artikel pertama</Link>}</Empty></div>
      ) : (
        <div className="card flush">
          <ul className="rows">
            <li className="rows-head"><span>Judul</span><span>Status</span><span>SEO</span><span>Kata</span><span>Views</span><span>Diubah</span><span /></li>
            {list.map((a) => (
              <li key={a.id} className="row">
                <Link href={`/admin/articles/${a.id}`} className="row-title">
                  <span className="recent-th">{a.featuredImage ? <img src={a.featuredImage} alt="" /> : <AIcon name="articles" size={18} />}</span>
                  <span><b>{a.title}</b><small>/{a.slug}{a.seo?.focusKeyphrase ? ` · 🎯 ${a.seo.focusKeyphrase}` : ""}</small></span>
                </Link>
                <span className="cell" data-label="Status"><StatusPill status={a.status} /></span>
                <span className="cell" data-label="SEO"><ScoreDot score={a.seoScore} /> {a.seoScore ?? "—"}</span>
                <span className="cell" data-label="Kata">{a.wordCount}</span>
                <span className="cell" data-label="Views">{a.views || 0}</span>
                <span className="cell muted" data-label="Diubah">{fmtDateTime(a.updatedAt)}</span>
                <span className="cell actions">
                  {a.status === "published" && <a href={`/articles/${a.slug}`} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="Lihat" title="Lihat"><AIcon name="eye" size={17} /></a>}
                  <Link href={`/admin/articles/${a.id}`} className="icon-btn" aria-label="Edit" title="Edit"><AIcon name="edit" size={17} /></Link>
                  <button className="icon-btn danger-text" onClick={() => remove(a)} aria-label="Hapus" title="Hapus"><AIcon name="trash" size={17} /></button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link href="/admin/articles/new" className="fab" aria-label="Tulis artikel baru"><AIcon name="plus" size={22} /></Link>
    </div>
  );
}
