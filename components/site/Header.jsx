"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Icon from "./Icon";

const NAV = [
  { href: "/work", label: "WORK" },
  { href: "/about", label: "ABOUT" },
  { href: "/articles", label: "ARTICLES" },
];

export function Logo({ className = "" }) {
  return (
    <Link href="/" className={`logo ${className}`} aria-label="Rezz.studio — beranda">
      <img src="/brand/logo-mark-white.png" alt="" width="26" height="28" className="logo-mark" />
      <span className="logo-word">REZZ</span>
    </Link>
  );
}

export default function Header({ email = "hello@rezz.studio", social = {} }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) window.__lenis?.stop(); else window.__lenis?.start();
  }, [open]);

  return (
    <>
      <header className={`site-header ${solid ? "is-solid" : ""}`}>
        <div className="container header-in">
          <Logo />
          <nav className="nav-desktop" aria-label="Utama">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={pathname?.startsWith(n.href) ? "active" : ""}>{n.label}</Link>
            ))}
          </nav>
          <a className="btn btn-outline btn-sm header-cta" href={`mailto:${email}`}>LET’S TALK <Icon name="arrow" size={14} /></a>
          <button className="menu-btn" aria-label="Buka menu" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" size={24} /></button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="container mm-top">
              <Logo />
              <button className="menu-btn" aria-label="Tutup menu" onClick={() => setOpen(false)}><Icon name="close" size={24} /></button>
            </div>
            <nav className="mm-nav container" aria-label="Menu mobile">
              {[{ href: "/", label: "HOME" }, ...NAV].map((n, i) => (
                <motion.div key={n.href} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.08 + i * 0.07, type: "spring", stiffness: 260, damping: 26 }}>
                  <Link href={n.href} className="mm-link">{n.label}</Link>
                </motion.div>
              ))}
              <motion.a href={`mailto:${email}`} className="btn btn-accent mm-cta" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>LET’S TALK <Icon name="arrow" size={16} /></motion.a>
            </nav>
            <div className="container mm-foot">
              <a href={`mailto:${email}`}><Icon name="mail" size={18} /> Email</a>
              {social.linkedin && <a href={social.linkedin} target="_blank" rel="noopener noreferrer"><Icon name="linkedin" size={18} /> LinkedIn</a>}
              {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer"><Icon name="instagram" size={18} /> Instagram</a>}
              <p className="mm-meta"><img src="/brand/logo-full-white.png" alt="Rezz.studio — creativity on the blood" width="150" /></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
