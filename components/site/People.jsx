"use client";
import { useRef } from "react";
import Art from "./Art";
import Icon from "./Icon";

export default function People({ items }) {
  const ref = useRef(null);
  const by = (dir) => ref.current?.scrollBy({ left: dir * (ref.current.firstElementChild?.clientWidth || 280) + dir * 16, behavior: "smooth" });
  return (
    <div className="people">
      <button className="people-nav prev" onClick={() => by(-1)} aria-label="Sebelumnya"><Icon name="arrowLeft" size={18} /></button>
      <ul className="people-track" ref={ref} data-stagger="0.1">
        {items.map((p) => (
          <li key={p.role} className="person">
            <Art variant={p.art} className="person-art fill"><span className="person-sil" aria-hidden="true" /></Art>
            <div className="person-body">
              <h3>{p.role}</h3>
              <span>{p.sub}</span>
              <blockquote>“{p.quote}”</blockquote>
            </div>
          </li>
        ))}
      </ul>
      <button className="people-nav next" onClick={() => by(1)} aria-label="Berikutnya"><Icon name="arrow" size={18} /></button>
    </div>
  );
}
