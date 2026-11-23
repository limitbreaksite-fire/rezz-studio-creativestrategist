"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Icon from "./Icon";
import { parseVideo } from "@/lib/video";

// Tombol/kartu yang membuka modal video (YouTube/Vimeo/file upload).
export default function PlayCard({ video, title, className = "", children, as = "button" }) {
  const [open, setOpen] = useState(false);
  const v = parseVideo(video);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.__lenis?.stop();
    return () => { window.removeEventListener("keydown", onKey); window.__lenis?.start(); };
  }, [open]);

  const Tag = as;
  return (
    <>
      <Tag type={as === "button" ? "button" : undefined} className={className} onClick={() => v && setOpen(true)} aria-label={`Putar video: ${title}`} data-playable={v ? "true" : "false"}>
        {children}
      </Tag>
      <AnimatePresence>
        {open && v && (
          <motion.div className="video-modal" role="dialog" aria-modal="true" aria-label={title}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div className="video-modal-box" initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }} onClick={(e) => e.stopPropagation()}>
              {v.type === "file"
                ? <video src={v.src} controls autoPlay playsInline />
                : <iframe src={`${v.embed}?autoplay=1&rel=0`} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />}
              <button className="video-close" onClick={() => setOpen(false)} aria-label="Tutup"><Icon name="close" size={22} /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
