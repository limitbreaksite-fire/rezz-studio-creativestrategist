"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion } from "motion/react";
import Art from "./Art";
import Icon from "./Icon";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const INTERVAL = 5600;

export default function Hero({ slides, lines, outlineFrom, sub, meta }) {
  const root = useRef(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // auto-advance
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % slides.length), INTERVAL);
    return () => clearTimeout(t);
  }, [active, paused, slides.length]);

  // intro + parallax
  useGSAP(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { gsap.set(".hero-line, .hero-fade", { clearProps: "all" }); return; }
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(".hero-line", { yPercent: 115 }, { yPercent: 0, duration: 1.2, stagger: 0.09, delay: 0.15 })
      .fromTo(".hero-fade", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, "-=0.7")
      .fromTo(".hero-index li", { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, stagger: 0.08 }, "-=0.9");
    gsap.to(".hero-bg", { yPercent: 14, scale: 1.06, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero-copy", { yPercent: -12, opacity: 0.2, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom 20%", scrub: true } });
  }, { scope: root });

  return (
    <section className="hero" ref={root} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel" aria-label="Kategori karya">
      <div className="hero-bg" aria-hidden="true">
        {slides.map((s, i) => (
          <div key={s.id} className={`hero-slide ${i === active ? "is-active" : ""}`}>
            <Art variant={s.art} src={s.thumbnail} className="fill" />
          </div>
        ))}
        <div className="hero-shade" />
      </div>

      <div className="container hero-in">
        <div className="hero-copy">
          <h1 className="hero-title" aria-label={lines.join(" ")}>
            {lines.map((l, i) => (
              <span className="mask" key={l} aria-hidden="true"><span className={`hero-line ${i >= outlineFrom ? "outline" : ""}`}>{l}</span></span>
            ))}
          </h1>
          <p className="hero-sub hero-fade">{sub}</p>
          <div className="hero-fade">
            <a href="#selected-edits" className="btn btn-outline" onClick={(e) => { e.preventDefault(); window.__lenis ? window.__lenis.scrollTo("#selected-edits", { offset: -20 }) : document.getElementById("selected-edits")?.scrollIntoView({ behavior: "smooth" }); }}>
              EXPLORE WORK <Icon name="arrowDown" size={14} />
            </a>
          </div>
        </div>

        <ol className="hero-index" aria-label="Pilih kategori">
          {slides.map((s, i) => (
            <li key={s.id}>
              <button type="button" className={i === active ? "is-active" : ""} onClick={() => setActive(i)} aria-current={i === active}>
                <span className="hi-n">{String(i + 1).padStart(2, "0")}</span>
                <span className="hi-l">{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="hero-thumbs container" aria-hidden="true">
        {slides.map((s, i) => (
          <button key={s.id} type="button" tabIndex={-1} className={i === active ? "is-active" : ""} onClick={() => setActive(i)}>
            <Art variant={s.art} src={s.thumbnail} className="fill" />
            <span>{String(i + 1).padStart(2, "0")}</span>
          </button>
        ))}
      </div>

      <div className="hero-progress" aria-hidden="true">
        <motion.span key={`${active}-${paused}`} initial={{ scaleX: 0 }} animate={{ scaleX: paused ? 0 : 1 }} transition={{ duration: paused ? 0 : INTERVAL / 1000, ease: "linear" }} />
      </div>
      <div className="hero-scroll" aria-hidden="true"><Icon name="arrowDown" size={18} /></div>
    </section>
  );
}
