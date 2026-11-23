import Link from "next/link";
import Icon from "./Icon";

export default function Footer({ settings }) {
  const s = settings.social || {};
  return (
    <footer className="site-footer">
      <div className="container footer-in">
        <div className="footer-brand">
          <img src="/brand/logo-full-white.png" alt="Rezz.studio — creativity on the blood, business designers" width="180" height="198" loading="lazy" />
          <p>{settings.tagline}<br />Based in {settings.location} · Available for Remote Work</p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link href="/work">Work</Link>
          <Link href="/about">About</Link>
          <Link href="/articles">Articles</Link>
          <Link href="/feed.xml">RSS</Link>
        </nav>
        <div className="footer-social">
          {s.linkedin && <a href={s.linkedin} target="_blank" rel="noopener noreferrer"><Icon name="linkedin" size={18} /> LinkedIn</a>}
          {s.instagram && <a href={s.instagram} target="_blank" rel="noopener noreferrer"><Icon name="instagram" size={18} /> Instagram</a>}
          {s.youtube && <a href={s.youtube} target="_blank" rel="noopener noreferrer"><Icon name="youtube" size={18} /> YouTube</a>}
          <a href={`mailto:${settings.email}`}><Icon name="mail" size={18} /> Email</a>
        </div>
      </div>
      <div className="container footer-bottom">© {new Date().getFullYear()} {settings.siteName}. All rights reserved.</div>
    </footer>
  );
}
