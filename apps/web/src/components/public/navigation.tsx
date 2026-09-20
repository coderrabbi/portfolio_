'use client';
import { BrandLogo } from '../brand-logo';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import type { Settings } from '@gr/shared';
import { MotionToggle } from './motion-preference';
const links = ['Home', 'About', 'Work', 'Services', 'Experience', 'Contact'];
export function Navbar({ settings: s }: { settings: Settings }) {
  const path = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false),
    [active, setActive] = useState('home'),
    [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', scroll, { passive: true });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );
    document.querySelectorAll('main section[id]').forEach((el) => observer.observe(el));
    return () => {
      window.removeEventListener('scroll', scroll);
      observer.disconnect();
    };
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const menuButton = menuRef.current;
    document.body.style.overflow = 'hidden';
    document.documentElement.dataset.navigationOpen = 'true';
    window.dispatchEvent(new Event('gr-navigation-change'));
    const desktop = matchMedia('(min-width: 761px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab') {
        const items = [
          ...(navRef.current?.querySelectorAll<HTMLAnchorElement>('a') || []),
          menuRef.current,
        ].filter((v): v is HTMLAnchorElement | HTMLButtonElement => v !== null);
        if (e.shiftKey && document.activeElement === items[0]) {
          e.preventDefault();
          items.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
          e.preventDefault();
          items[0]?.focus();
        }
      }
    };
    navRef.current?.querySelector('a')?.focus({ preventScroll: true });
    window.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = previous;
      delete document.documentElement.dataset.navigationOpen;
      window.dispatchEvent(new Event('gr-navigation-change'));
      desktop.removeEventListener('change', closeOnDesktop);
      menuButton?.focus({ preventScroll: true });
      window.removeEventListener('keydown', key);
    };
  }, [open]);
  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''} ${open ? 'menu-open' : ''}`}>
      <Link className="brand" href="/" aria-label={`${s.name} home`}>
        {s.logo ? <Image src={s.logo} alt="Coder Rabbi" width={58} height={38} /> : <BrandLogo />}
      </Link>
      <nav
        ref={navRef}
        id="main-navigation"
        data-lenis-prevent={open ? true : undefined}
        aria-label="Main navigation"
        className={open ? 'nav-links open' : 'nav-links'}
      >
        {links.map((n) => (
          <a
            key={n}
            className={active === n.toLowerCase() ? 'active' : ''}
            onClick={() => setOpen(false)}
            href={`${path === '/' ? '' : '/'}#${n.toLowerCase()}`}
          >
            {n}
          </a>
        ))}
      </nav>
      <Link href="/#contact" className="nav-cta">
        Let’s talk <ArrowUpRight size={17} />
      </Link>
      <button
        ref={menuRef}
        className="menu-button"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}
export function Footer({ settings: s }: { settings: Settings }) {
  return (
    <footer className="footer">
      <div className="footer-top">
        <span className="eyebrow">THE NEXT GREAT THING STARTS WITH A CONVERSATION</span>
        <a href={`mailto:${s.email}`} className="text-link">
          {s.email} <ArrowUpRight size={20} />
        </a>
      </div>
      <a href="/#contact" className="footer-title">
        {s.footerText.split('\n').map((line, i) => (
          <span key={i}>{line}</span>
        ))}
        <ArrowUpRight />
      </a>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {s.name}
        </span>
        <div>
          {s.socials.map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noreferrer">
              {link.label} ↗
            </a>
          ))}
        </div>
        <MotionToggle />
        <a href="/#home">BACK TO TOP ↑</a>
      </div>
    </footer>
  );
}
