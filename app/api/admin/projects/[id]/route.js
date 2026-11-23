import { deleteProject, getProject, saveProject } from "@/lib/db";
import { bad, json, readBody, revalidateSite } from "@/lib/api-helpers";
import { cleanProject } from "@/lib/projectInput";

export async function GET(_r, { params }) {
  const { id } = await params;
  const p = await getProject(id);
  return p ? json(p) : bad("Tidak ditemukan", 404);
}
export async function PUT(request, { params }) {
  const { id } = await params;
  if (!(await getProject(id))) return bad("Tidak ditemukan", 404);
  const body = await readBody(request);
  if (!body?.title?.trim()) return bad("Judul wajib diisi");
  const saved = await saveProject(cleanProject({ ...body, id }));
  revalidateSite();
  return json(saved);
}
export async function DELETE(_r, { params }) {
  const { id } = await params;
  await deleteProject(id);
  revalidateSite();
  return json({ ok: true });
}
