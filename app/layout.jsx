import { Anton, Inter, Mrs_Saint_Delafield } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/db";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const sig = Mrs_Saint_Delafield({ subsets: ["latin"], weight: "400", variable: "--font-sign", display: "swap" });

export async function generateMetadata() {
  const s = await getSettings();
  const base = s.siteUrl || "https://rezz.studio";
  return {
    metadataBase: new URL(base),
    title: { default: `${s.siteName} — ${s.tagline}`, template: s.metaTitleTemplate.replace("%title%", "%s") },
    description: s.defaultMetaDescription,
    applicationName: s.siteName,
    authors: [{ name: s.authorName }],
    alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
    openGraph: { type: "website", siteName: s.siteName, locale: s.language === "en" ? "en_US" : "id_ID", images: [{ url: s.images?.ogImage || s.defaultOgImage || "/og-default.png", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    icons: { icon: [{ url: "/icon.png", type: "image/png" }, { url: "/favicon.ico" }], apple: "/apple-icon.png" },
  };
}

export const viewport = { themeColor: "#0a0a0c", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }) {
  const s = await getSettings();
  return (
    <html lang={s.language || "id"} className={`${anton.variable} ${inter.variable} ${sig.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js');setTimeout(function(){document.documentElement.classList.add('reveal-fallback')},4500)" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
