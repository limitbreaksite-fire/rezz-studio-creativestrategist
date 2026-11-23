// Parse URL video → { type, embed } (YouTube/Vimeo → iframe, file → <video>)
export function parseVideo(url) {
  const u = String(url || "").trim();
  if (!u) return null;
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (m) return { type: "youtube", id: m[1], embed: `https://www.youtube-nocookie.com/embed/${m[1]}`, thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return { type: "vimeo", id: m[1], embed: `https://player.vimeo.com/video/${m[1]}` };
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(u) || u.startsWith("/uploads/")) return { type: "file", src: u };
  return null;
}

export function videoHtml(url) {
  const v = parseVideo(url);
  if (!v) return "";
  if (v.type === "file") return `<figure class="media-figure"><video src="${v.src}" controls preload="metadata" playsinline></video></figure><p></p>`;
  return `<div class="video-embed"><iframe src="${v.embed}" title="Video" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div><p></p>`;
}
