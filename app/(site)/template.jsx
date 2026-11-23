"use client";
import { motion } from "motion/react";

// Transisi halaman: naik sedikit + fade ringan (opacity awal 0.4 supaya konten SSR tetap terbaca bot/no-JS).
export default function Template({ children }) {
  return (
    <motion.div initial={{ opacity: 0.4, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
