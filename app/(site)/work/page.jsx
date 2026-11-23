import WorkGrid from "@/components/site/WorkGrid";
import { listProjects, getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Work — Selected Edits",
  description: "Kumpulan karya video editing: entertainment, sport & action, cinematic, dramatic, lifestyle, dan travel. Enam mood, satu editor.",
  alternates: { canonical: "/work" },
};

export default async function WorkPage() {
  const [projects, settings] = await Promise.all([listProjects({ status: "published" }), getSettings()]);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "CollectionPage", name: "Selected Edits", url: `${settings.siteUrl}/work`,
    mainEntity: { "@type": "ItemList", itemListElement: projects.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title })) },
  };
  return (
    <section className="page-top section-light">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container">
        <div className="section-head stack">
          <h1 className="page-title">SELECTED EDITS</h1>
          <p className="section-sub">Six different moods. One editor.</p>
        </div>
        <WorkGrid projects={projects} />
      </div>
    </section>
  );
}
