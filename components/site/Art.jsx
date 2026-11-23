import { parseVideo } from "@/lib/video";

// Visual pengganti (gradient + grain) bila belum ada foto/thumbnail. Ganti lewat Dashboard → Portfolio / Settings.
export default function Art({ variant = "neon", src, alt = "", className = "", video, children, label }) {
  let img = src;
  if (!img && video) { const v = parseVideo(video); if (v?.thumb) img = v.thumb; }
  return (
    <div className={`art art-${variant} ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      {img ? <img src={img} alt={alt} loading="lazy" decoding="async" className="art-img" /> : variant === "portrait" ? <Silhouette /> : null}
      {label ? <span className="art-label" aria-hidden="true">{label}</span> : null}
      <span className="art-grain" aria-hidden="true" />
      {children}
    </div>
  );
}

function Silhouette() {
  return (
    <svg className="art-silhouette" viewBox="0 0 400 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a2a35" /><stop offset="1" stopColor="#0c0c10" /></linearGradient>
      </defs>
      <ellipse cx="200" cy="170" rx="68" ry="82" fill="url(#sil)" />
      <path d="M40 500c0-110 70-170 160-170s160 60 160 170z" fill="url(#sil)" />
    </svg>
  );
}
