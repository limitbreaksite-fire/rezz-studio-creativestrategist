import crypto from "node:crypto";
import { bumpArticleViews, trackView } from "@/lib/db";
import { json } from "@/lib/api-helpers";

export async function POST(request) {
  let body = {};
  try { body = await request.json(); } catch {}
  const p = String(body.path || "/").slice(0, 200);
  if (!p.startsWith("/") || p.startsWith("/admin")) return json({ ok: false });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const ua = request.headers.get("user-agent") || "";
  const day = new Date().toISOString().slice(0, 10);
  // hash harian anonim — tidak menyimpan IP mentah
  const hash = crypto.createHash("sha256").update(`${ip}|${ua}|${day}|${process.env.AUTH_SECRET || "s"}`).digest("hex").slice(0, 16);
  await trackView(p, hash);
  const m = p.match(/^\/articles\/([\w-]+)$/);
  if (m) await bumpArticleViews(m[1]);
  return json({ ok: true });
}
