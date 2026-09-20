'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useReducedMotion } from './motion-preference';
gsap.registerPlugin(ScrollTrigger);
export function Effects() {
  const reduced = useReducedMotion();
  const path = usePathname(),
    cursor = useRef<HTMLDivElement>(null),
    progress = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (
      !sessionStorage.getItem('gr-visited') &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setLoading(true);
      sessionStorage.setItem('gr-visited', '1');
      const timer = setTimeout(() => setLoading(false), 750);
      return () => clearTimeout(timer);
    }
  }, []);
  useEffect(() => {
    const fine = matchMedia('(pointer:fine) and (min-width: 900px)').matches;
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (progress.current)
        progress.current.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    };
    window.addEventListener('scroll', update, { passive: true });
    let lenis: Lenis | undefined,
      raf = 0;
    if (!reduced) {
      lenis = new Lenis({ duration: 1.05, anchors: true });
      const tick = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      lenis.on('scroll', ScrollTrigger.update);
    }
    const menuState = () => {
      if (document.documentElement.dataset.navigationOpen === 'true') lenis?.stop();
      else lenis?.start();
    };
    window.addEventListener('gr-navigation-change', menuState);
    menuState();
    const ctx = gsap.context(() => {
      if (reduced) return;
      gsap.utils.toArray<HTMLElement>('.scroll-timeline').forEach((el) => {
        gsap.fromTo(
          el.querySelector('.timeline-rail i'),
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 70%', end: 'bottom 65%', scrub: 0.6 },
          },
        );
        el.querySelectorAll('article').forEach((article) => {
          ScrollTrigger.create({
            trigger: article,
            start: 'top 70%',
            onEnter: () => article.classList.add('is-reached'),
            onLeaveBack: () => article.classList.remove('is-reached'),
          });
        });
      });
      gsap.fromTo(
        '.hero h1 > span',
        { y: 35, clipPath: 'inset(100% 0 0 0)' },
        {
          y: 0,
          clipPath: 'inset(0% 0 0 0)',
          duration: 0.85,
          stagger: 0.11,
          ease: 'power3.out',
          delay: 0.15,
        },
      );
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) =>
        gsap.fromTo(
          el,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          },
        ),
      );
    });
    const move = (e: PointerEvent) => {
      if (cursor.current && fine && !reduced) {
        cursor.current.style.opacity = '1';
        cursor.current.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
        const target =
          e.target instanceof Element ? e.target.closest('a,button,[data-cursor]') : null;
        cursor.current.classList.toggle('expanded', !!target);
        cursor.current.textContent = target?.hasAttribute('data-cursor') ? 'VIEW' : '';
      }
    };
    window.addEventListener('pointermove', move);
    const anchors = (e: MouseEvent) => {
      const a =
        e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (!a || !lenis) return;
      const target = document.getElementById(a.hash.slice(1));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -76 });
        history.replaceState(null, '', a.hash);
      }
    };
    document.addEventListener('click', anchors);
    return () => {
      window.removeEventListener('gr-navigation-change', menuState);
      ctx.revert();
      lenis?.destroy();
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', update);
      document.removeEventListener('click', anchors);
    };
  }, [path, reduced]);
  return (
    <>
      <div ref={progress} className="scroll-progress" />
      <div ref={cursor} className="custom-cursor" aria-hidden="true" />
      {loading && (
        <div className="intro-loader" aria-hidden="true">
          <span>coderrabbi</span>
          <div>
            INITIALIZING CREATIVE MODE <b>100</b>
          </div>
        </div>
      )}
    </>
  );
}
export function Counter({ value, suffix }: { value: number; suffix: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.textContent = String(value);
      return;
    }
    const context = gsap.context(() => {
      const state = { value: 0 };
      gsap.to(state, {
        value,
        duration: 1.4,
        roundProps: 'value',
        scrollTrigger: { trigger: el, start: 'top 95%', once: true },
        onUpdate: () => {
          el.textContent = String(state.value);
        },
      });
    });
    return () => context.revert();
  }, [value, reduced]);
  return (
    <>
      <span ref={ref}>{value}</span>
      {suffix}
    </>
  );
}
