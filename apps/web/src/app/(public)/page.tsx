import type { Metadata } from 'next';
import Image from 'next/image';
import {
  ArrowUpRight,
  Code2,
  Database,
  ShoppingBag,
  Layers,
  Globe,
  MoveUpRight,
} from 'lucide-react';
import { getPortfolio, siteUrl } from '@/lib/server';
import { Hero } from '@/components/public/hero';
import { ProjectGrid } from '@/components/public/projects';
import { ContactForm } from '@/components/public/contact';
import { Counter } from '@/components/public/effects';
export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getPortfolio();
  return {
    title: s.seoTitle,
    description: s.seoDescription,
    alternates: { canonical: siteUrl },
    openGraph: { title: s.seoTitle, description: s.seoDescription, url: siteUrl, type: 'website' },
    twitter: { card: 'summary', title: s.seoTitle, description: s.seoDescription },
  };
}
function Heading({
  number,
  label,
  title,
  children,
}: {
  number: string;
  label: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading" data-reveal>
      <div>
        <span className="eyebrow">
          <b>{number}</b> / {label}
        </span>
        <h2>{title.replaceAll('\\n', '\n')}</h2>
      </div>
      {children}
    </div>
  );
}
export default async function Home() {
  const {
    settings: s,
    projects,
    categories,
    services,
    skills,
    experience,
    testimonials,
  } = await getPortfolio();
  const groups = [...new Set(skills.map((v) => v.category.name))];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name: s.name,
        jobTitle: s.title,
        url: siteUrl,
        sameAs: s.socials.map((l) => l.url),
      },
      { '@type': 'WebSite', name: s.seoTitle, url: siteUrl },
    ],
  };
  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Hero settings={s} />
      <div className="tech-marquee" aria-label="Technology stack">
        <div>
          {[0, 1].map((n) => (
            <div key={n} aria-hidden={n === 1}>
              {skills.slice(0, 16).map((skill) => (
                <span key={skill.id}>
                  {skill.name}
                  <i>✳</i>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <section id="about" className="section about">
        <Heading number="01" label="A LITTLE ABOUT ME" title={s.aboutTitle} />
        <div className={`about-layout${s.portrait ? '' : ' about-layout-no-photo'}`}>
          <div className="about-content" data-reveal>
            <div className="about-statement">
              <span className="large-asterisk" aria-hidden="true">
                ✳
              </span>
              <p>{s.philosophy}</p>
            </div>
            <div className="about-copy">
              <span className="eyebrow">DESIGN SENSIBILITY. ENGINEERING PRECISION.</span>
              <p>{s.about}</p>
            </div>
            <div className="about-principles">
              <span>Thoughtful design</span>
              <span>Purposeful motion</span>
              <span>Reliable engineering</span>
            </div>
            <div className="about-actions">
              <a href="#contact" className="text-link">
                Let’s build something meaningful <ArrowUpRight size={18} />
              </a>
              {s.resumeUrl && (
                <a className="text-link" href={s.resumeUrl} target="_blank" rel="noreferrer">
                  View résumé ↗
                </a>
              )}
            </div>
          </div>
          {s.portrait && (
            <div className="about-portrait" data-reveal>
              <Image src={s.portrait} alt={s.name} fill sizes="(max-width:760px) 90vw, 45vw" />
              <div className="about-portrait-caption">
                <span>THE PERSON BEHIND THE PIXELS</span>
                <strong>{s.name}</strong>
              </div>
            </div>
          )}
        </div>
        <div className="stats">
          {s.stats.map((stat) => (
            <div key={stat.label}>
              <strong>
                <Counter value={stat.value} suffix={stat.suffix} />
              </strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
        {s.demoMode && (
          <p className="demo-note">
            Portfolio preview · sample statistics and case studies. Editable from the dashboard.
          </p>
        )}
      </section>
      <section className="section expertise">
        <Heading
          number="02"
          label="WHAT I BRING TO THE TABLE"
          title="Different disciplines.\nOne connected vision."
        />
        <div className="bento">
          <article className="bento-main" data-reveal>
            <Code2 />
            <span className="eyebrow">01 / CREATIVE DEVELOPMENT</span>
            <h3>
              Interfaces with
              <br />a little more soul.
            </h3>
            <p>
              Thoughtful design meets expressive code.
              <br />
              Built to feel effortless on every screen.
            </p>
            <div className="code-window">
              <div>
                <i />
                <i />
                <i />
                <span>creative.tsx</span>
              </div>
              <code>
                <em>const</em> experience = {'{'}
                <br />
                &nbsp; design: <b>"intentional"</b>,<br />
                &nbsp; motion: <b>"meaningful"</b>,<br />
                &nbsp; performance: <b>"essential"</b>
                <br />
                {'}'};
              </code>
            </div>
          </article>
          <article className="bento-small" data-reveal>
            <Database />
            <span className="eyebrow">02 / FULL-STACK ENGINEERING</span>
            <h3>
              Strong foundations.
              <br />
              Limitless possibilities.
            </h3>
            <div className="architecture-labels">
              <span>Interface</span>
              <i>↓</i>
              <span>API + Logic</span>
              <i>↓</i>
              <span>Database</span>
            </div>
          </article>
          <article className="bento-small wordpress" data-reveal>
            <ShoppingBag />
            <span className="eyebrow">03 / WORDPRESS & COMMERCE</span>
            <h3>
              Made to work.
              <br />
              Built to grow.
            </h3>
            <div className="wp-mark">
              W<span>+</span>
            </div>
          </article>
          <article className="bento-strip">
            <span>
              <Globe /> Responsive by nature
            </span>
            <span>
              <Layers /> Built for performance
            </span>
            <span>
              <MoveUpRight /> Motion with purpose
            </span>
          </article>
        </div>
      </section>
      <section className="section work" id="work">
        <Heading number="03" label="SELECTED WORK" title="Ideas, brought to life.">
          <p>
            A selection of digital experiences.
            <br />
            Each with its own story to tell.
          </p>
        </Heading>
        <ProjectGrid projects={projects} categories={categories} />
      </section>
      <section className="section services" id="services">
        <Heading number="04" label="HOW I CAN HELP" title="Your vision.\nMy craft." />
        <div className="service-cards">
          {services.map((service, i) => {
            const Icon = [ShoppingBag, Code2, Database, Layers, Globe, MoveUpRight][i % 6];
            return (
              <article className="service-card" key={service.id} data-reveal>
                <div className="service-card-top">
                  <span className="service-icon">
                    <Icon size={25} />
                  </span>
                  <span className="eyebrow">{String(i + 1).padStart(2, '0')} / EXPERTISE</span>
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <a href="#contact" className="service-link" aria-label={'Discuss ' + service.title}>
                  Let’s build this <ArrowUpRight size={19} />
                </a>
              </article>
            );
          })}
        </div>
      </section>
      <section className="section process">
        <Heading
          number="05"
          label="FROM FIRST IDEA TO FINAL DETAIL"
          title="Good work is a process."
        />
        <div className="process-grid scroll-timeline">
          <div className="timeline-rail" aria-hidden="true">
            <i />
          </div>
          {[
            ['Discovery', 'Listen, ask, and understand what matters.'],
            ['Strategy', 'A clear direction and a practical roadmap.'],
            ['Design', 'Explore the experience before writing the code.'],
            ['Development', 'Build with intention, one detail at a time.'],
            ['Testing', 'Refine across devices, browsers, and real use.'],
            ['Launch', 'Go live with confidence and room to grow.'],
          ].map(([title, desc], i) => (
            <article key={title} data-reveal>
              <span>0{i + 1}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section experience" id="experience">
        <Heading
          number="06"
          label="THE JOURNEY SO FAR"
          title="Always building.\nAlways evolving."
        />
        <div className="timeline scroll-timeline">
          <div className="timeline-rail" aria-hidden="true">
            <i />
          </div>
          {experience.map((item) => (
            <article key={item.id} data-reveal>
              <span className="timeline-date">
                {item.startDate} — {item.endDate || 'Present'}
              </span>
              <div>
                <span className="eyebrow">
                  {item.company} / {item.employmentType}
                </span>
                <h3>{item.position}</h3>
                <p>{item.description}</p>
                <div className="tags">
                  {item.technologies.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
              {item.website && (
                <a
                  href={item.website}
                  aria-label={`Visit ${item.company}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ArrowUpRight />
                </a>
              )}
            </article>
          ))}
        </div>
        <div className="skill-groups">
          {groups.map((group) => (
            <div key={group}>
              <h4>{group}</h4>
              <div>
                {skills
                  .filter((skill) => skill.category.name === group)
                  .map((skill) => (
                    <span key={skill.id}>{skill.name}</span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      {s.showTestimonials && testimonials.length > 0 && (
        <section className="section testimonials">
          <Heading
            number="07"
            label="WORDS FROM COLLABORATORS"
            title="Good things, built together."
          />
          <div className="testimonial-track">
            {testimonials.map((t) => (
              <figure key={t.id}>
                <span className="quote-mark">“</span>
                <blockquote>{t.review}</blockquote>
                <figcaption>
                  {t.name}
                  <span>
                    {t.company} · {'★'.repeat(t.rating)}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
      <section className="section contact" id="contact">
        <div className="contact-heading" data-reveal>
          <span className="eyebrow">08 / LET’S MAKE IT HAPPEN</span>
          <h2>
            HAVE AN
            <br />
            IDEA?
            <br />
            <span>LET’S BUILD IT.</span>
          </h2>
          <p>
            Something ambitious. Something different.
            <br />
            Tell me what you have in mind.
          </p>
          <a className="text-link" href={`mailto:${s.email}`}>
            {s.email}
            <ArrowUpRight size={18} />
          </a>
          <div className="availability">
            <i className={s.available ? 'available' : ''} />
            {s.availability}
          </div>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
