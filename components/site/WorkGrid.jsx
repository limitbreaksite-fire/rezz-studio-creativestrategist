"use client";
import { motion } from "motion/react";
import Art from "./Art";
import Icon from "./Icon";
import PlayCard from "./PlayCard";

export default function WorkGrid({ projects, numbered = true }) {
  return (
    <ul className="work-grid" data-stagger="0.09">
      {projects.map((p, i) => (
        <li key={p.id}>
          <PlayCard video={p.videoUrl} title={p.title} className="work-card">
            <motion.span className="work-card-in" whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
              <Art variant={p.art} src={p.thumbnail} video={p.videoUrl} alt="" className="fill work-art" />
              <span className="work-shade" />
              {numbered && <span className="work-n">{String(i + 1).padStart(2, "0")}</span>}
              <span className="work-meta">
                <span className="work-title">{p.category || p.title}</span>
                <span className="work-sub">{p.subtitle}</span>
              </span>
              <span className="work-play"><Icon name="play" size={18} /></span>
            </motion.span>
          </PlayCard>
        </li>
      ))}
    </ul>
  );
}
