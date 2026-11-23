// Sanitizer HTML whitelist (isomorfik: jalan di server & browser tanpa DOM).
// Dipakai saat menyimpan artikel, saat paste ke editor, dan saat render di halaman publik.

const ALLOWED = {
  p: ["style"], br: [], hr: [], h1: ["id", "style"], h2: ["id", "style"], h3: ["id", "style"], h4: ["id", "style"], h5: ["id"], h6: ["id"],
  strong: [], b: [], em: [], i: [], u: [], s: [], strike: [], del: [], mark: [], sub: [], sup: [], small: [],
  blockquote: [], pre: [], code: [], ul: [], ol: [], li: [], figure: ["class"], figcaption: [],
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  table: [], thead: [], tbody: [], tfoot: [], tr: [], th: ["colspan", "rowspan", "scope"], td: ["colspan", "rowspan"], caption: [],
  div: ["class", "style"], span: ["style"],
  video: ["src", "controls", "poster", "preload", "playsinline", "width", "height", "muted", "loop"],
  source: ["src", "type"],
  iframe: ["src", "title", "width", "height", "allow", "allowfullscreen", "frameborder", "loading", "referrerpolicy"],
};
const DROP_WITH_CONTENT = new Set(["script", "style", "noscript", "template", "object", "embed", "svg", "math", "form", "textarea", "select", "button"]);
const VOID = new Set(["br", "hr", "img", "source"]);
const IFRAME_HOSTS = /^https:\/\/(www\.youtube\.com\/embed\/|www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/)[\w\-?=&%./]+$/i;
const SAFE_CLASSES = /^(video-embed|media-figure|align-(left|center|right)|table-wrap|callout)(\s+(video-embed|media-figure|align-(left|center|right)|table-wrap|callout))*$/;
const SAFE_STYLE = /^\s*text-align\s*:\s*(left|right|center|justify)\s*;?\s*$/i;

function safeUrl(v, { img = false } = {}) {
  const url = String(v || "").trim();
  if (!url) return null;
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(url)) return url;
  if (img && /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(url)) return url;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) return url; // relatif
  return null;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unesc = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function parseAttrs(raw) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(raw))) {
    const name = m[1].toLowerCase();
    const val = m[2] ?? m[3] ?? m[4] ?? "";
    if (!(name in attrs)) attrs[name] = unesc(val);
  }
  return attrs;
}

export function sanitizeHtml(html) {
  if (!html) return "";
  let src = String(html).replace(/<!--[\s\S]*?-->/g, "");
  let out = "";
  let last = 0;
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
  let m;
  let skipUntil = null; // nama tag yang sedang di-drop beserta isinya
  while ((m = tagRe.exec(src))) {
    const [full, nameRaw, rawAttrs] = m;
    const name = nameRaw.toLowerCase();
    const closing = full.startsWith("</");
    if (skipUntil) {
      if (closing && name === skipUntil) skipUntil = null;
      last = tagRe.lastIndex;
      continue;
    }
    out += src.slice(last, m.index).replace(/<(?![a-zA-Z/!])/g, "&lt;");
    last = tagRe.lastIndex;
    if (DROP_WITH_CONTENT.has(name)) { if (!closing && !full.endsWith("/>")) skipUntil = name; continue; }
    if (!(name in ALLOWED)) continue;
    if (closing) { if (!VOID.has(name)) out += `</${name}>`; continue; }

    const attrs = parseAttrs(rawAttrs);
    const allow = ALLOWED[name];
    let s = "";
    for (const k of allow) {
      if (!(k in attrs)) continue;
      let v = attrs[k];
      if (k === "href") { v = safeUrl(v); if (!v) continue; }
      else if (k === "src") {
        v = safeUrl(v, { img: name === "img" });
        if (!v) continue;
        if (name === "iframe" && !IFRAME_HOSTS.test(v)) continue;
      }
      else if (k === "class") { if (!SAFE_CLASSES.test(v)) continue; }
      else if (k === "style") { if (!SAFE_STYLE.test(v)) continue; }
      else if (k === "target") { if (v !== "_blank") continue; }
      else if (k === "id") { v = v.replace(/[^\w-]/g, ""); if (!v) continue; }
      else if (["controls", "allowfullscreen", "playsinline", "muted", "loop"].includes(k)) { s += ` ${k}`; continue; }
      s += ` ${k}="${esc(v)}"`;
    }
    if (name === "iframe" && !/ src="/.test(s)) continue;
    if (name === "a" && /target="_blank"/.test(s)) s = s.replace(/ rel="[^"]*"/, "") + ' rel="noopener noreferrer"';
    out += `<${name}${s}>`;
  }
  if (!skipUntil) out += src.slice(last).replace(/<(?![a-zA-Z/!])/g, "&lt;");
  return out;
}
