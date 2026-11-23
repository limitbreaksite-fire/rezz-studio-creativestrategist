import { deleteMedia, updateMedia } from "@/lib/db";
import { bad, json, readBody, str } from "@/lib/api-helpers";

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await readBody(request);
  const m = await updateMedia(id, { alt: str(body?.alt, 200) });
  return m ? json(m) : bad("Tidak ditemukan", 404);
}
export async function DELETE(_r, { params }) {
  const { id } = await params;
  await deleteMedia(id);
  return json({ ok: true });
}
