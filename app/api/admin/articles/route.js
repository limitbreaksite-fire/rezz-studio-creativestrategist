import { getSettings, listArticles, saveArticle } from "@/lib/db";
import { bad, json, readBody, revalidateSite } from "@/lib/api-helpers";
import { cleanArticleInput } from "@/lib/articleInput";
import { analyze } from "@/lib/seo/analyzer";
import { toAnalysisInput } from "@/lib/seo/input";

export async function GET() {
  const [list, settings] = await Promise.all([listArticles(), getSettings()]);
  return json(list.map(({ content, ...a }) => {
    let seoScore = null;
    try { seoScore = analyze(toAnalysisInput({ ...a, content }, settings, list)).score; } catch {}
    return { ...a, seoScore, wordCount: (content || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length };
  }));
}

export async function POST(request) {
  const body = await readBody(request);
  if (!body) return bad("Body tidak valid");
  const input = cleanArticleInput(body);
  if (!input.title?.trim()) return bad("Judul wajib diisi");
  const saved = await saveArticle(input);
  revalidateSite();
  return json(saved, { status: 201 });
}
