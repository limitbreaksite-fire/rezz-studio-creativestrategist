"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { api } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api("/api/admin/login", { method: "POST", body: { password: pw } });
      const next = sp.get("next");
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  return (
    <div className="login-wrap">
      <motion.form onSubmit={submit} className="login-card" initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 24 }}>
        <img src="/brand/logo-full-white.png" alt="Rezz.studio — creativity on the blood" width="150" />
        <h1>Masuk ke Dashboard</h1>
        <p className="muted">Kelola portfolio, artikel, dan website kamu dari mana saja.</p>
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoFocus required />
        {err && <p className="form-error" role="alert">{err}</p>}
        <button className="abtn primary lg" disabled={busy}>{busy ? "Memeriksa…" : "Masuk"}</button>
      </motion.form>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
