import Link from "next/link";
import Hero from "@/components/site/Hero";
import Art from "@/components/site/Art";
import Icon from "@/components/site/Icon";
import WorkGrid from "@/components/site/WorkGrid";
import PlayCard from "@/components/site/PlayCard";
import { HOME } from "@/lib/content";
import { getSettings, listProjects } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const s = await getSettings();
  return {
    title: { absolute: `${s.siteName} — Video Editor, Motion Designer & Visual Storyteller` },
    description: s.defaultMetaDescription,
    alternates: { canonical: "/" },
    openGraph: { title: `${s.siteName} — ${s.tagline}`, description: s.defaultMetaDescription, url: "/", images: [{ url: s.images?.ogImage || s.defaultOgImage }] },
  };
}

export default async function HomePage() {
  const [settings, projects] = await Promise.all([getSettings(), listProjects({ status: "published" })]);
  const featured = projects.filter((p) => !p.isPersona && p.featuredOnHome !== false);
  const persona = projects.find((p) => p.isPersona);
  const slides = [featured[0], featured[1], featured[2], featured[4] || featured[3]].filter(Boolean).map((p) => ({ id: p.id, label: (p.category || p.title).toUpperCase(), art: p.art, thumbnail: p.thumbnail }));
  const H = HOME;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${settings.siteUrl}/#website`, url: settings.siteUrl, name: settings.siteName, inLanguage: settings.language },
      {
        "@type": "Person", "@id": `${settings.siteUrl}/#person`, name: settings.authorName, jobTitle: "Video Editor & Motion Designer",
        url: settings.siteUrl, image: `${settings.siteUrl}/brand/logo-mark-black.png`, email: settings.email,
        address: { "@type": "PostalAddress", addressCountry: "ID" },
        sameAs: Object.values(settings.social || {}).filter(Boolean),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero slides={slides.length ? slides : [{ id: "x", label: "ENTERTAINMENT", art: "neon" }]} lines={H.hero.lines} outlineFrom={H.hero.outlineFrom} sub={H.hero.sub} meta={H.hero.meta} />

      {/* 01 — About the editor */}
      <section className="intro section-dark" id="about-editor">
        <div className="container intro-in">
          <div className="intro-photo" data-reveal="scale">
            <span className="kicker"><b>01</b> {H.intro.kicker}</span>
            <Art variant="portrait" src={settings.images?.heroPortrait} alt={settings.images?.heroPortrait ? `Portrait ${settings.authorName}` : ""} className="fill portrait" />
          </div>
          <div className="intro-main">
            <h2 className="intro-title">
              <span className="mask"><span data-reveal="mask">{H.intro.title[0]}<span className="grad">{H.intro.title[1]}</span></span></span>
            </h2>
            <p className="intro-roles" data-reveal>{H.intro.roles.map((r) => <span key={r}>{r}</span>)}</p>
            <p className="intro-body" data-reveal data-delay="0.1">{H.intro.body}</p>
            <p className="signature" aria-hidden="true">{settings.siteName}</p>
            <ul className="intro-meta">
              <li><Icon name="pin" size={16} /> Based in {settings.location}</li>
              <li><Icon name="remote" size={16} /> Available for Remote Work</li>
            </ul>
          </div>
          <aside className="intro-quote" data-reveal="right">
            <h3>{H.intro.quoteTitle}</h3>
            <p>{H.intro.quote}</p>
            <Link href="/about" className="btn btn-outline btn-sm">MORE ABOUT ME <Icon name="arrow" size={14} /></Link>
          </aside>
        </div>
      </section>

      {/* 02 — Editing mindset */}
      <section className="mindset section-dark" aria-labelledby="mindset-title">
        <div className="container">
          <span className="kicker"><b>02</b> {H.mindset.kicker}</span>
          <h2 id="mindset-title" className="mindset-title">
            <span className="mindset-line" data-fill-solid>{H.mindset.lines[0]}</span>
            <span className="mindset-line" data-fill>
              <span className="out">{H.mindset.lines[1]}</span>
              <span className="fill" aria-hidden="true">{H.mindset.lines[1]}</span>
            </span>
          </h2>
          <ul className="mindset-items" data-stagger="0.08">
            {H.mindset.items.map((it) => (
              <li key={it.label}><Icon name={it.icon} size={26} /><div><b>{it.label}</b><span>{it.text}</span></div></li>
            ))}
          </ul>
        </div>
      </section>

      {/* 03 — Selected edits */}
      <section className="edits section-light" id="selected-edits">
        <div className="container">
          <div className="section-head">
            <div><span className="kicker dark"><b>03</b> {H.edits.kicker}</span><p className="section-sub">{H.edits.sub}</p></div>
            <Link href="/work" className="btn btn-outline-dark btn-sm">VIEW ALL WORKS <Icon name="arrow" size={14} /></Link>
          </div>
          <WorkGrid projects={featured.slice(0, 6)} />
          <div className="language" data-reveal>
            <span>EDITING LANGUAGE</span>
            <p>Different stories, different approaches.</p>
            <ul>{H.edits.language.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        </div>
      </section>

      {/* 04 — For Persona */}
      <section className="persona section-light alt" id="persona">
        <div className="container persona-in">
          <div className="persona-copy">
            <span className="kicker dark"><b>07</b> PROJECT</span>
            <h2 className="persona-title" data-reveal>{H.persona.title}</h2>
            <p className="persona-lead" data-reveal data-delay="0.1">{H.persona.lead}</p>
            <p className="persona-tags">{H.persona.tags}</p>
            <blockquote className="persona-quote">{H.persona.quote.map((q) => <span key={q}>{q}</span>)}</blockquote>
            <PlayCard video={persona?.videoUrl} title="For Persona" className="btn btn-dark">WATCH PROJECT <Icon name="arrow" size={14} /></PlayCard>
          </div>
          <PlayCard video={persona?.videoUrl} title="For Persona — Hospitality Edit" className="persona-media" as="div">
            <Art variant="persona" src={persona?.thumbnail} video={persona?.videoUrl} className="fill" />
            <span className="persona-play"><Icon name="play" size={28} /></span>
          </PlayCard>
        </div>
      </section>

      {/* Why Persona */}
      <section className="why section-dark">
        <div className="container why-in">
          <div>
            <h2 className="why-title" data-reveal>{H.persona.why}</h2>
            <p className="section-sub" data-reveal data-delay="0.1">{H.persona.whySub}</p>
            <ul className="why-items" data-stagger="0.08">
              {H.persona.whyItems.map((it) => <li key={it.label}><Icon name={it.icon} size={24} /><div><b>{it.label}</b><span>{it.text}</span></div></li>)}
            </ul>
          </div>
          <div className="why-cta">
            <p data-reveal>{H.persona.whyBody}</p>
            <h2 className="cta-big" data-reveal data-delay="0.1">LET’S MAKE SOMETHING WORTH WATCHING.</h2>
            <a className="btn btn-accent" href={`mailto:${settings.email}`}>LET’S TALK <Icon name="arrow" size={14} /></a>
          </div>
        </div>
      </section>
    </>
  );
}
