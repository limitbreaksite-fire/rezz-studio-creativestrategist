import { listProjects, saveProject } from "@/lib/db";
import { bad, json, readBody, revalidateSite } from "@/lib/api-helpers";
import { cleanProject } from "@/lib/projectInput";

export async function GET() { return json(await listProjects()); }

export async function POST(request) {
  const body = await readBody(request);
  if (!body?.title?.trim()) return bad("Judul wajib diisi");
  const saved = await saveProject(cleanProject(body));
  revalidateSite();
  return json(saved, { status: 201 });
}
