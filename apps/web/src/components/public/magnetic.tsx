'use client';
import { useRef } from 'react';
export function MagneticLink({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href: string;
  className: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  return (
    <a
      ref={ref}
      href={href}
      className={className}
      onPointerMove={(e) => {
        if (
          document.documentElement.dataset.motion === 'reduce' ||
          !matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)').matches
        )
          return;
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.1}px,${(e.clientY - r.top - r.height / 2) * 0.15}px)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = '';
      }}
    >
      {children}
    </a>
  );
}
