"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import AIcon from "./AIcon";

/* ------------------------------- Toast ------------------------------- */
const ToastCtx = createContext(null);
const ConfirmCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);
export const useConfirm = () => useContext(ConfirmCtx);

export function AdminProviders({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const toast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === "error" ? 6000 : 3200);
  }, []);
  toast.error = (m) => toast(m, "error");

  const confirm = useCallback((opts) => new Promise((resolve) => setConfirmState({ ...opts, resolve })), []);
  const close = (v) => { confirmState?.resolve(v); setConfirmState(null); };

  return (
    <ToastCtx.Provider value={toast}>
      <ConfirmCtx.Provider value={confirm}>
        {children}
        <div className="toasts" aria-live="polite">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div key={t.id} layout initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }} className={`toast ${t.type}`}>
                <AIcon name={t.type === "error" ? "info" : "check"} size={16} /> {t.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {confirmState && (
            <Modal onClose={() => close(false)} title={confirmState.title || "Konfirmasi"} size="sm">
              <p className="muted">{confirmState.message}</p>
              <div className="modal-actions">
                <button className="abtn ghost" onClick={() => close(false)}>Batal</button>
                <button className={`abtn ${confirmState.danger ? "danger" : "primary"}`} onClick={() => close(true)}>{confirmState.confirmLabel || "Ya, lanjutkan"}</button>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}

/* ------------------------------- Modal ------------------------------- */
export function Modal({ title, onClose, children, size = "md", footer }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector("input, textarea, select, button.primary")?.focus?.();
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <motion.div ref={ref} className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title}
        initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Tutup"><AIcon name="close" /></button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ Kecil-kecil ------------------------------ */
export const Spinner = ({ size = 18 }) => <span className="spinner" style={{ width: size, height: size }} role="status" aria-label="Memuat" />;

export function StatusPill({ status }) {
  const map = { published: ["Published", "green"], draft: ["Draft", "amber"], scheduled: ["Scheduled", "blue"] };
  const [label, c] = map[status] || [status, "gray"];
  return <span className={`pill ${c}`}>{label}</span>;
}

export function ScoreDot({ score, size = 10 }) {
  if (score === null || score === undefined) return <span className="sdot gray" style={{ width: size, height: size }} />;
  const c = score >= 80 ? "good" : score >= 50 ? "ok" : "bad";
  return <span className={`sdot ${c}`} style={{ width: size, height: size }} title={`Skor SEO ${score}`} />;
}

export function Empty({ icon = "info", title, children }) {
  return <div className="empty-state"><AIcon name={icon} size={28} /><b>{title}</b>{children}</div>;
}

export function Tags({ value = [], onChange, placeholder = "Ketik lalu Enter", max = 20, id }) {
  const [v, setV] = useState("");
  const add = (raw) => {
    const items = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    const next = [...value];
    for (const i of items) if (!next.some((x) => x.toLowerCase() === i.toLowerCase()) && next.length < max) next.push(i);
    onChange(next); setV("");
  };
  return (
    <div className="tags-input">
      {value.map((t) => <span key={t} className="tag">{t}<button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Hapus ${t}`}>×</button></span>)}
      <input id={id} value={v} placeholder={value.length ? "" : placeholder} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(v); } else if (e.key === "Backspace" && !v && value.length) onChange(value.slice(0, -1)); }}
        onBlur={() => add(v)} />
    </div>
  );
}

export function useDebounced(value, ms = 350) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return d;
}
