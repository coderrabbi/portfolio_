'use client';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import type { Settings } from '@gr/shared';
import { MagneticLink } from './magnetic';
const Orb = dynamic(() => import('./orb'), {
  ssr: false,
  loading: () => <div className="orb-fallback" />,
});
export function Hero({ settings: s }: { settings: Settings }) {
  return (
    <section className="hero" id="home">
      <div className="hero-grid" />
      <div className="hero-topline">
        <span className="eyebrow">INDEPENDENT DEVELOPER & DIGITAL CRAFTSPERSON</span>
        <span className="availability">
          <i className={s.available ? 'available' : ''} />
          {s.availability}
        </span>
      </div>
      <div className="hero-content">
        <div className="hero-copy">
          <p className="hero-intro">
            HELLO, I’M {s.name} <span>↗</span>
          </p>
          <h1>
            {s.heroLines.map((line, i) => (
              <span key={i} className={i === 1 ? 'accent-line' : ''}>
                {line}
                <span className="period">.</span>
              </span>
            ))}
          </h1>
          <p className="hero-description">{s.introduction}</p>
          <div className="hero-actions">
            <MagneticLink className="button primary" href="#work">
              View projects <ArrowUpRight size={19} />
            </MagneticLink>
            <a className="text-link" href="#contact">
              Start a project <ArrowUpRight size={19} />
            </a>
          </div>
        </div>
        <div className={`hero-visual ${s.heroPortrait ? 'has-portrait' : ''}`}>
          <Orb portrait={Boolean(s.heroPortrait)} />
          {s.heroPortrait && (
            <div className="hero-portrait">
              <Image
                src={s.heroPortrait}
                alt={s.name}
                fill
                priority
                sizes="(max-width:760px) 85vw, 40vw"
              />
            </div>
          )}
          <span className="scene-coordinate">FIG. 001 — THE CREATIVE CORE</span>
          <span className="scene-tag">&lt; ideas.into(reality) /&gt;</span>
          <div className="orbit-caption">
            <span>DESIGN-DRIVEN.</span>
            <span>ENGINEERED TO PERFORM.</span>
          </div>
        </div>
      </div>
      <div className="hero-bottom">
        <a href="#about">
          <span className="scroll-circle">
            <ArrowDown size={16} />
          </span>
          SCROLL TO EXPLORE
        </a>
        <span>
          {s.location}
          <b> / </b>
          {s.title}
        </span>
        <span className="hero-index">01 — 08</span>
      </div>
    </section>
  );
}
