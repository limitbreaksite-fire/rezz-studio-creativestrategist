import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const json = (data, init) => NextResponse.json(data, init);
export const bad = (msg, status = 400) => NextResponse.json({ error: msg }, { status });

export function revalidateSite() {
  for (const p of ["/", "/about", "/work", "/articles", "/sitemap.xml", "/feed.xml"]) revalidatePath(p);
  revalidatePath("/articles/[slug]", "page");
}

export async function readBody(request) {
  try { return await request.json(); } catch { return null; }
}

export function str(v, max = 500) { return String(v ?? "").slice(0, max); }
export function strList(v, maxItems = 20, max = 80) {
  return (Array.isArray(v) ? v : String(v || "").split(","))
    .map((x) => String(x).trim().slice(0, max)).filter(Boolean).slice(0, maxItems);
}
