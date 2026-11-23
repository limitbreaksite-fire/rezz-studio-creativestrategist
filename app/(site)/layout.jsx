import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import SiteEffects from "@/components/site/SiteEffects";
import Track from "@/components/site/Track";
import { getSettings } from "@/lib/db";

export default async function SiteLayout({ children }) {
  const settings = await getSettings();
  return (
    <>
      <a href="#main" className="skip-link">Lewati ke konten</a>
      <Header email={settings.email} social={settings.social} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
      <SiteEffects />
      <Track />
    </>
  );
}
