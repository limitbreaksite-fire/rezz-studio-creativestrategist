"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Pencatat kunjungan anonim (tanpa cookie, tanpa IP mentah) → statistik dashboard.
export default function Track() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (navigator.doNotTrack === "1") return;
    const body = JSON.stringify({ path: pathname });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  }, [pathname]);
  return null;
}
