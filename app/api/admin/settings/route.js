import { getSettings, saveSettings } from "@/lib/db";
import { bad, json, readBody, revalidateSite, str } from "@/lib/api-helpers";

export async function GET() { return json(await getSettings()); }

export async function PUT(request) {
  const b = await readBody(request);
  if (!b) return bad("Body tidak valid");
  const s = b.social || {}, im = b.images || {};
  const saved = await saveSettings({
    siteName: str(b.siteName, 80), siteUrl: str(b.siteUrl, 200).replace(/\/$/, ""), tagline: str(b.tagline, 160),
    metaTitleTemplate: str(b.metaTitleTemplate, 120) || "%title% | Rezz",
    defaultMetaDescription: str(b.defaultMetaDescription, 320), authorName: str(b.authorName, 80), authorUrl: str(b.authorUrl, 200),
    location: str(b.location, 80), email: str(b.email, 120), language: b.language === "en" ? "en" : "id",
    defaultOgImage: str(b.defaultOgImage, 500) || "/og-default.png",
    social: { linkedin: str(s.linkedin, 200), instagram: str(s.instagram, 200), youtube: str(s.youtube, 200), tiktok: str(s.tiktok, 200) },
    images: { heroPortrait: str(im.heroPortrait, 500), aboutHero: str(im.aboutHero, 500), ogImage: str(im.ogImage, 500) },
  });
  revalidateSite();
  return json(saved);
}
