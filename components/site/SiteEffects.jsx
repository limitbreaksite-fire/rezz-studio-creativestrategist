"use client";
// Efek global: smooth scroll (Lenis) + GSAP ScrollTrigger yang dipasang berdasarkan atribut data-*.
//   data-reveal="up|fade|mask|scale|left|right"  data-delay="0.2"   → muncul saat scroll
//   data-stagger                                    → anak-anak langsung muncul berurutan
//   data-parallax="0.2"                             → parallax vertikal (scrub)
//   data-fill                                       → teks outline terisi mengikuti scroll (scrub)
//   data-draw                                       → garis tumbuh dari kiri ke kanan (scrub)
//   data-count                                      → angka naik
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export default function SiteEffects() {
  const pathname = usePathname();

  // Smooth scroll sekali saja
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); window.__lenis = null; };
  }, []);

  // Pasang animasi tiap pindah halaman
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.__lenis?.scrollTo(0, { immediate: true });
    const root = document.documentElement;
    if (reduce) { root.classList.add("reveal-fallback"); return; }
    const ctx = gsap.context(() => {
      const from = {
        up: { y: 48, opacity: 0 }, fade: { opacity: 0 }, scale: { scale: 0.92, opacity: 0 },
        left: { x: -60, opacity: 0 }, right: { x: 60, opacity: 0 }, mask: { yPercent: 110, opacity: 1 },
      };
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        const kind = el.dataset.reveal || "up";
        const delay = parseFloat(el.dataset.delay || "0");
        if (kind === "mask") {
          gsap.fromTo(el, { yPercent: 110 }, { yPercent: 0, duration: 1.05, delay, ease: "expo.out", scrollTrigger: { trigger: el.parentElement || el, start: "top 88%", once: true } });
        } else {
          gsap.fromTo(el, from[kind] || from.up, { x: 0, y: 0, scale: 1, opacity: 1, duration: 1, delay, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
        }
      });
      gsap.utils.toArray("[data-stagger]").forEach((wrap) => {
        gsap.fromTo(wrap.children, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: parseFloat(wrap.dataset.stagger) || 0.1, ease: "power3.out", scrollTrigger: { trigger: wrap, start: "top 85%", once: true } });
      });
      gsap.utils.toArray("[data-parallax]").forEach((el) => {
        const amt = parseFloat(el.dataset.parallax) || 0.15;
        gsap.fromTo(el, { yPercent: -amt * 50 }, { yPercent: amt * 50, ease: "none", scrollTrigger: { trigger: el.parentElement || el, start: "top bottom", end: "bottom top", scrub: true } });
      });
      gsap.utils.toArray("[data-fill]").forEach((el) => {
        const fill = el.querySelector(".fill");
        if (!fill) return;
        gsap.fromTo(fill, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", ease: "none", scrollTrigger: { trigger: el, start: "top 85%", end: "top 35%", scrub: 0.6 } });
      });
      gsap.utils.toArray("[data-draw]").forEach((el) => {
        gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, transformOrigin: "left center", ease: "none", scrollTrigger: { trigger: el, start: "top 90%", end: "top 55%", scrub: true } });
      });
      gsap.utils.toArray("[data-count]").forEach((el) => {
        const end = parseFloat(el.dataset.count);
        const o = { v: 0 };
        gsap.to(o, { v: end, duration: 1.6, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString()), scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      });
    });
    const t = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => { clearTimeout(t); ctx.revert(); };
  }, [pathname]);

  return null;
}
