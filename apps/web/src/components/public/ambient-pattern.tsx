'use client';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from './motion-preference';
export function AmbientPattern() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !matchMedia('(pointer:fine)').matches) return;
    let frame = 0,
      x = innerWidth / 2,
      y = innerHeight / 2,
      tx = x,
      ty = y;
    const tick = () => {
      x += (tx - x) * 0.075;
      y += (ty - y) * 0.075;
      ref.current?.style.setProperty('--mx', `${x}px`);
      ref.current?.style.setProperty('--my', `${y}px`);
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.3) frame = requestAnimationFrame(tick);
      else frame = 0;
    };
    const move = (event: PointerEvent) => {
      tx = event.clientX;
      ty = event.clientY;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(frame);
    };
  }, [reduced]);
  return (
    <div ref={ref} className="ambient-pattern" aria-hidden="true">
      <div />
    </div>
  );
}
