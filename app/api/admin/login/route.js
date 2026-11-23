import { cookies } from "next/headers";
import { COOKIE_NAME, SESSION_SECONDS, adminPassword, createSessionToken, safeEqual, loginAllowed, loginFailed, loginOk } from "@/lib/auth";
import { bad, json, readBody } from "@/lib/api-helpers";

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!loginAllowed(ip)) return bad("Terlalu banyak percobaan. Coba lagi 15 menit lagi.", 429);
  const body = await readBody(request);
  const pw = adminPassword();
  if (!pw) return bad("ADMIN_PASSWORD belum diset di environment server.", 500);
  if (!body || !safeEqual(String(body.password || ""), pw)) {
    loginFailed(ip);
    return bad("Password salah.", 401);
  }
  const token = await createSessionToken();
  if (!token) return bad("AUTH_SECRET belum diset di environment server.", 500);
  loginOk(ip);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_SECONDS,
  });
  return json({ ok: true });
}
