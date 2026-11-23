import Link from "next/link";

export const metadata = { title: "404 — Halaman tidak ditemukan", robots: { index: false } };

export default function NotFound() {
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeContent: "center", textAlign: "center", gap: 20, padding: 24, background: "#0a0a0c", color: "#fff" }}>
      <img src="/brand/logo-mark-white.png" alt="" width="56" style={{ margin: "0 auto" }} />
      <h1 style={{ fontFamily: "var(--font-display), Impact, sans-serif", fontSize: "clamp(64px,14vw,160px)", lineHeight: 0.9, margin: 0 }}>404</h1>
      <p style={{ color: "#9a9aa3", margin: 0 }}>Potongan ini tidak ada di timeline.</p>
      <Link href="/" className="btn btn-outline" style={{ justifySelf: "center" }}>KEMBALI KE HOME</Link>
    </main>
  );
}
