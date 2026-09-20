'use client';
import { useEffect, useState } from 'react';
const key = 'gr-reduced-motion';
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      const value = media.matches || localStorage.getItem(key) === 'true';
      setReduced(value);
      document.documentElement.dataset.motion = value ? 'reduce' : 'full';
    };
    sync();
    media.addEventListener('change', sync);
    window.addEventListener('gr-motion-change', sync);
    return () => {
      media.removeEventListener('change', sync);
      window.removeEventListener('gr-motion-change', sync);
    };
  }, []);
  return reduced;
}
export function MotionToggle() {
  const reduced = useReducedMotion();
  return (
    <button
      className="motion-toggle"
      aria-pressed={reduced}
      onClick={() => {
        localStorage.setItem(key, String(!reduced));
        window.dispatchEvent(new Event('gr-motion-change'));
      }}
    >
      {reduced ? 'Reduced motion on' : 'Reduce motion'}
    </button>
  );
}
