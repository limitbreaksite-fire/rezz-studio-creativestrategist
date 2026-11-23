"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import AIcon from "@/components/admin/AIcon";
import { Spinner, StatusPill, Empty } from "@/components/admin/ui";
import { api, fmtDateTime } from "@/lib/api";

function Stat({ icon, color, value, label, sub, delta, i }) {
  return (
    <motion.div className="stat" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
      <span className={`stat-ic ${color}`}><AIcon name={icon} size={22} /></span>
      <div>
        <b>{value}</b>
        <span>{label}</span>
        {sub && <small>{sub}</small>}
        {delta !== undefined && <small className={delta >= 0 ? "up" : "down"}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% dari bulan lalu</small>}
      </div>
    </motion.div>
  );
}

function TrafficChart({ series }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 200, P = { l: 8, r: 8, t: 16, b: 26 };
  const max = Math.max(5, ...series.map((s) => s.views));
  const x = (i) => P.l + (i / Math.max(1, series.length - 1)) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
  const pts = series.map((s, i) => [x(i), y(s.views)]);
  const smooth = pts.map((p, i) => {
    if (i === 0) return `M${p[0]},${p[1]}`;
    const q = pts[i - 1], cx = (q[0] + p[0]) / 2;
    return `C${cx},${q[1]} ${cx},${p[1]} ${p[0]},${p[1]}`;
  }).join(" ");
  const area = `${smooth} L${x(series.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`;
  const labels = [0, 7, 14, 21, series.length - 1].filter((v, i, a) => a.indexOf(v) === i);
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(series.length - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (series.length - 1)))));
  };
  const hv = hover !== null ? series[hover] : null;
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Grafik kunjungan 30 hari terakhir" onMouseMove={onMove} onMouseLeave={() => setHover(null)} onTouchMove={(e) => onMove(e.touches[0])}>
        <defs>
          <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6d6bff" stopOpacity=".5" /><stop offset="1" stopColor="#6d6bff" stopOpacity="0" /></linearGradient>
          <linearGradient id="gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#c04bff" /><stop offset="1" stopColor="#3b82f6" /></linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => <line key={t} x1={P.l} x2={W - P.r} y1={y(max * t)} y2={y(max * t)} stroke="rgba(255,255,255,.07)" />)}
        <motion.path d={area} fill="url(#ga)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        <motion.path d={smooth} fill="none" stroke="url(#gl)" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} />
        {labels.map((i) => <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"} fill="#8a8a97" fontSize="11">{new Date(series[i].date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</text>)}
        {hv && <><line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke="rgba(255,255,255,.25)" strokeDasharray="3 3" /><circle cx={x(hover)} cy={y(hv.views)} r="5" fill="#fff" stroke="#6d6bff" strokeWidth="3" /></>}
      </svg>
      {hv && <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%` }}><b>{hv.views} views</b><small>{new Date(hv.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</small></div>}
    </div>
  );
}

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [tab, setTab] = useState("all");
  const [err, setErr] = useState("");
  useEffect(() => { api("/api/admin/stats").then(setD).catch((e) => setErr(e.message)); }, []);
  const recent = useMemo(() => (d?.recent || []).filter((r) => tab === "all" || (tab === "portfolio" ? r.kind === "project" : r.kind === "article")), [d, tab]);

  if (err) return <p className="form-error">{err}</p>;
  if (!d) return <div className="center-pad"><Spinner size={28} /></div>;
  const c = d.counts;

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Welcome back, Rezz! <span aria-hidden="true">👋</span></h1><p className="muted">Kelola portfolio, artikel dan website kamu dari mana saja.</p></div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="abtn ghost">View Website <AIcon name="external" size={15} /></a>
      </div>

      <div className="stats">
        <Stat i={0} icon="portfolio" color="blue" value={c.projects} label="Portfolio Projects" sub={`${c.projectsPublished} Published · ${c.projects - c.projectsPublished} Draft`} />
        <Stat i={1} icon="articles" color="purple" value={c.articles} label="Articles" sub={`${c.articlesPublished} Published · ${c.articles - c.articlesPublished} Draft`} />
        <Stat i={2} icon="views" color="green" value={d.views.toLocaleString()} label="Total Views (30d)" delta={d.viewsDelta} />
        <Stat i={3} icon="users" color="indigo" value={d.visitors.toLocaleString()} label="Unique Visitors (30d)" delta={d.visitorsDelta} />
      </div>

      <div className="dash-grid">
        <section className="card">
          <div className="card-head">
            <h2>Recent Content</h2>
            <div className="seg">{[["all", "All"], ["portfolio", "Portfolio"], ["article", "Articles"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
          </div>
          {recent.length === 0 ? <Empty title="Belum ada konten" /> : (
            <ul className="recent">
              {recent.map((r) => (
                <li key={r.kind + r.id}>
                  <Link href={r.href} className="recent-row">
                    <span className="recent-th">{r.thumb ? <img src={r.thumb} alt="" /> : <AIcon name={r.kind === "project" ? "film" : "articles"} size={18} />}</span>
                    <span className="recent-t"><b>{r.title}</b><small>{fmtDateTime(r.date)}</small></span>
                    <span className="pill dim">{r.kind === "project" ? "Project" : "Article"}</span>
                    <StatusPill status={r.status} />
                    <AIcon name="chevronRight" size={16} className="muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="dash-right">
          <section className="card quick">
            <span className="pill blue">Quick Action</span>
            <h2>Upload Project Baru</h2>
            <p className="muted">Tambahkan video, gambar, deskripsi dan publish dalam hitungan menit.</p>
            <Link href="/admin/portfolio?new=1" className="abtn grad lg block"><AIcon name="plus" size={16} /> Add New Project</Link>
            <div className="quick-row">
              <Link href="/admin/articles/new" className="abtn primary"><AIcon name="plus" size={15} /> New Article</Link>
              <Link href="/admin/media" className="abtn ghost"><AIcon name="media" size={15} /> Media</Link>
              <Link href="/admin/settings" className="abtn ghost"><AIcon name="settings" size={15} /> Settings</Link>
            </div>
          </section>

          <section className="card">
            <div className="card-head"><h2>Traffic Overview <small className="muted">(30 hari terakhir)</small></h2></div>
            <TrafficChart series={d.series} />
            {d.views === 0 && <p className="muted small">Belum ada kunjungan tercatat — statistik muncul begitu website dikunjungi.</p>}
          </section>

          {d.topArticles.some((a) => a.views > 0) && (
            <section className="card">
              <div className="card-head"><h2>Artikel Terpopuler</h2></div>
              <ol className="top-list">{d.topArticles.filter((a) => a.views > 0).map((a) => <li key={a.id}><Link href={`/admin/articles/${a.id}`}>{a.title}</Link><b>{a.views}</b></li>)}</ol>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
