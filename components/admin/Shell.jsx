"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import AIcon from "./AIcon";
import { AdminProviders } from "./ui";
import { api } from "@/lib/api";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/admin/portfolio", label: "Portfolio", icon: "portfolio" },
  { href: "/admin/articles", label: "Articles", icon: "articles", sub: [{ href: "/admin/articles", label: "All Articles", exact: true }, { href: "/admin/articles/new", label: "Add New" }] },
  { href: "/admin/media", label: "Media Library", icon: "media" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];
const BOTTOM = [NAV[0], NAV[1], NAV[2], NAV[3]];

const isActive = (pathname, item) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"));

function Brand() {
  return (
    <Link href="/admin" className="a-brand">
      <img src="/brand/logo-mark-white.png" alt="" width="26" height="28" />
      <span><b>REZZ</b><small>PORTFOLIO CMS</small></span>
    </Link>
  );
}

function NavList({ pathname, onNavigate }) {
  return (
    <nav className="a-nav" aria-label="Menu dashboard">
      {NAV.map((n) => {
        const active = isActive(pathname, n);
        return (
          <div key={n.href} className="a-nav-group">
            <Link href={n.href} className={`a-nav-item ${active ? "active" : ""}`} onClick={onNavigate}>
              <AIcon name={n.icon} /> <span>{n.label}</span>
              {n.sub && <AIcon name="chevron" size={14} className={`chev ${active ? "open" : ""}`} />}
            </Link>
            {n.sub && active && (
              <div className="a-subnav">
                {n.sub.map((s) => <Link key={s.href} href={s.href} onClick={onNavigate} className={pathname === s.href ? "active" : ""}>{s.label}</Link>)}
              </div>
            )}
          </div>
        );
      })}
      <a className="a-nav-item" href="/" target="_blank" rel="noopener noreferrer" onClick={onNavigate}><AIcon name="external" /> <span>View Website</span></a>
    </nav>
  );
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const editing = /^\/admin\/articles\/(new|[^/]+)$/.test(pathname);

  useEffect(() => setDrawer(false), [pathname]);

  async function logout() {
    try { await api("/api/admin/logout", { method: "POST" }); } catch {}
    router.replace("/admin/login");
  }

  return (
    <AdminProviders>
      <div className={`admin ${editing ? "is-editing" : ""}`}>
        <aside className="a-side" aria-label="Sidebar">
          <Brand />
          <NavList pathname={pathname} />
          <div className="a-user">
            <img src="/brand/logo-mark-white.png" alt="" className="avatar" />
            <div><b>Rezz</b><small>Admin</small></div>
            <button className="icon-btn" onClick={logout} aria-label="Keluar" title="Keluar"><AIcon name="logout" /></button>
          </div>
        </aside>

        <header className="a-topbar">
          <Brand />
          <button className="icon-btn" onClick={() => setDrawer(true)} aria-label="Buka menu"><AIcon name="menu" size={22} /></button>
        </header>

        <AnimatePresence>
          {drawer && (
            <motion.div className="a-drawer-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)}>
              <motion.aside className="a-drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }} onClick={(e) => e.stopPropagation()} aria-label="Menu">
                <div className="a-drawer-top"><Brand /><button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Tutup"><AIcon name="close" size={22} /></button></div>
                <NavList pathname={pathname} onNavigate={() => setDrawer(false)} />
                <div className="a-user">
                  <img src="/brand/logo-mark-white.png" alt="" className="avatar" />
                  <div><b>Rezz</b><small>Admin</small></div>
                  <button className="abtn ghost sm" onClick={logout}><AIcon name="logout" size={16} /> Keluar</button>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="a-main">{children}</main>

        <nav className="a-bottom" aria-label="Navigasi cepat">
          {BOTTOM.map((n) => (
            <Link key={n.href} href={n.href} className={isActive(pathname, n) ? "active" : ""}><AIcon name={n.icon} size={20} /><span>{n.label.split(" ")[0]}</span></Link>
          ))}
          <button onClick={() => setDrawer(true)}><AIcon name="menu" size={20} /><span>Menu</span></button>
        </nav>
      </div>
    </AdminProviders>
  );
}
