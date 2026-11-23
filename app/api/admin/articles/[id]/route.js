import { deleteArticle, getArticle, saveArticle } from "@/lib/db";
import { bad, json, readBody, revalidateSite } from "@/lib/api-helpers";
import { cleanArticleInput } from "@/lib/articleInput";

export async function GET(_req, { params }) {
  const { id } = await params;
  const a = await getArticle(id);
  return a ? json(a) : bad("Tidak ditemukan", 404);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  if (!(await getArticle(id))) return bad("Tidak ditemukan", 404);
  const body = await readBody(request);
  if (!body) return bad("Body tidak valid");
  const input = cleanArticleInput({ ...body, id });
  if (!input.title?.trim()) return bad("Judul wajib diisi");
  const saved = await saveArticle(input);
  revalidateSite();
  return json(saved);
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  await deleteArticle(id);
  revalidateSite();
  return json({ ok: true });
}
