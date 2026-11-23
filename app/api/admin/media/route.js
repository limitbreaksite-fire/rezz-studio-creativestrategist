import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { UPLOAD_DIR, addMedia, listMedia } from "@/lib/db";
import { bad, json } from "@/lib/api-helpers";
import { slugify } from "@/lib/seo/text";

export const runtime = "nodejs";

const TYPES = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
  "video/mp4": "mp4", "video/webm": "webm",
};
const MAX = 100 * 1024 * 1024;

export async function GET() { return json(await listMedia()); }

export async function POST(request) {
  let form;
  try { form = await request.formData(); } catch { return bad("Form tidak valid"); }
  const files = form.getAll("file").filter((f) => typeof f === "object" && f.arrayBuffer);
  if (!files.length) return bad("Tidak ada file");
  const out = [];
  for (const file of files) {
    const ext = TYPES[file.type];
    if (!ext) return bad(`Tipe file tidak didukung: ${file.type || "unknown"}. Gunakan JPG, PNG, WEBP, GIF, AVIF, MP4, atau WEBM.`);
    if (file.size > MAX) return bad("Ukuran file maksimal 100MB");
    const buf = Buffer.from(await file.arrayBuffer());
    const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "file";
    const d = new Date();
    const dir = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    const name = `${base}-${crypto.randomBytes(3).toString("hex")}.${ext}`;
    await fs.mkdir(path.join(UPLOAD_DIR, dir), { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, dir, name), buf);
    out.push(await addMedia({
      name: file.name, file: `${dir}/${name}`, url: `/uploads/${dir}/${name}`,
      type: file.type.startsWith("video") ? "video" : "image", mime: file.type, size: buf.length,
    }));
  }
  return json(out, { status: 201 });
}
