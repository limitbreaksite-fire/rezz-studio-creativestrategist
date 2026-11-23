import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function robots() {
  const s = await getSettings();
  const base = s.siteUrl.replace(/\/$/, "");
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
      // izinkan crawler AI agar konten bisa dikutip di AI search (hapus bila tidak diinginkan)
      { userAgent: ["GPTBot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended"], allow: ["/", "/articles", "/about", "/work"], disallow: ["/admin", "/api/"] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
