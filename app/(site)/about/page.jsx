import Art from "@/components/site/Art";
import Icon from "@/components/site/Icon";
import People from "@/components/site/People";
import { ABOUT } from "@/lib/content";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const s = await getSettings();
  const description = `Tentang ${s.siteName}: video editor, motion designer, dan visual storyteller dari ${s.location} dengan latar belakang desain, motion, konten digital, dan marketing.`;
  return {
    title: "About — More Than an Editor",
    description,
    alternates: { canonical: "/about" },
    openGraph: { title: `About ${s.siteName}`, description, url: "/about", type: "profile" },
  };
}

export default async function AboutPage() {
  const settings = await getSettings();
  const A = ABOUT;
  return (
    <>
      <section className="about-hero section-dark">
        <div className="about-hero-bg" aria-hidden="true">
          <Art variant="portrait" src={settings.images?.aboutHero} className="fill" />
          <div className="hero-shade" />
        </div>
        <div className="container about-hero-in">
          <span className="kicker accent">{A.hero.kicker}</span>
          <h1 className="about-title">
            {A.hero.lines.map((l) => <span className="mask" key={l}><span data-reveal="mask">{l}</span></span>)}
            {A.hero.outline.map((l) => <span className="mask" key={l}><span className="outline" data-reveal="mask" data-delay="0.15">{l}</span></span>)}
          </h1>
        </div>
      </section>

      <section className="story section-dark" aria-labelledby="story-title">
        <div className="container">
          <div className="section-head stack">
            <span className="kicker"><b>01</b> <span id="story-title">{A.story.kicker}</span></span>
            <p className="section-sub">{A.story.sub}</p>
          </div>
          <ol className="story-steps">
            {A.story.steps.map((s, i) => (
              <li key={s.n} data-reveal data-delay={String(i * 0.07)}>
                <div className="story-top"><b>{s.n}</b><i data-draw aria-hidden="true" /><Icon name="arrow" size={14} /></div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <Art variant={s.art} className="story-art fill" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="process section-light">
        <div className="container">
          <div className="section-head stack">
            <span className="kicker dark"><b>02</b> {A.process.kicker}</span>
            <p className="section-sub">{A.process.sub}</p>
          </div>
          <ol className="process-steps" data-stagger="0.12">
            {A.process.steps.map((s) => (
              <li key={s.n}>
                <b className="p-n">{s.n}</b>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <Art variant={s.art} className="process-art fill" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="people-sec section-dark">
        <div className="container">
          <div className="section-head stack">
            <span className="kicker"><b>03</b> {A.people.kicker}</span>
            <p className="section-sub">{A.people.sub}</p>
          </div>
          <People items={A.people.items} />
        </div>
      </section>

      <section className="next section-dark">
        <div className="next-bg" aria-hidden="true"><Art variant="travel" className="fill" /><div className="hero-shade" /></div>
        <div className="container next-in">
          <div>
            <span className="kicker"><b>04</b> {A.next.kicker}</span>
            <h2 className="next-title">
              <span className="mask"><span data-reveal="mask">{A.next.title[0]}</span></span>
              <span className="mask"><span className="grad" data-reveal="mask" data-delay="0.12">{A.next.title[1]}</span></span>
            </h2>
          </div>
          <div className="next-copy">
            <p data-reveal>{A.next.body}</p>
            <div className="next-actions" data-reveal data-delay="0.1">
              <a className="btn btn-accent" href={`mailto:${settings.email}`}>LET’S TALK <Icon name="arrow" size={14} /></a>
              <a className="btn btn-outline" href="/work">VIEW MY WORK</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
