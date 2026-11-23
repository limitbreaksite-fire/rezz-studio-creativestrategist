// Auth sederhana & aman: password dari env + cookie sesi bertanda tangan HMAC (Web Crypto, jalan di Edge & Node).
export const COOKIE_NAME = "rezz_session";
export const SESSION_SECONDS = 60 * 60 * 24 * 7; // 7 hari

const enc = new TextEncoder();

function secret() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV !== "production") return "dev-only-secret-change-me-please-0000";
  return null;
}

export function adminPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (process.env.NODE_ENV !== "production") return "rezz-admin";
  return null;
}

async function hmac(message) {
  const sec = secret();
  if (!sec) return null;
  const key = await crypto.subtle.importKey("raw", enc.encode(sec), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function createSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const sig = await hmac(`v1.${exp}`);
  return sig ? `v1.${exp}.${sig}` : null;
}

export async function verifySessionToken(token) {
  if (!token) return false;
  const [v, exp, sig] = token.split(".");
  if (v !== "v1" || !exp || !sig) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmac(`v1.${exp}`);
  return !!expected && safeEqual(sig, expected);
}

export async function isAuthed(request) {
  const token = request.cookies?.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

// rate limit login (memori proses — cukup untuk single instance)
const attempts = new Map();
export function loginAllowed(ip) {
  const now = Date.now();
  const rec = attempts.get(ip) || { n: 0, t: now };
  if (now - rec.t > 15 * 60 * 1000) { rec.n = 0; rec.t = now; }
  attempts.set(ip, rec);
  return rec.n < 6;
}
export function loginFailed(ip) {
  const rec = attempts.get(ip) || { n: 0, t: Date.now() };
  rec.n += 1;
  attempts.set(ip, rec);
}
export function loginOk(ip) { attempts.delete(ip); }
