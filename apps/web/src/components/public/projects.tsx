'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import type { Project, Category } from '@gr/shared';
export function ProjectArt({ project, index = 0 }: { project: Project; index?: number }) {
  return project.thumbnail ? (
    <Image
      src={project.thumbnail}
      alt={project.title}
      fill
      sizes="(max-width: 700px) 100vw, 60vw"
      className="project-image"
    />
  ) : (
    <div className={`project-art art-${index % 3}`} aria-hidden="true">
      <span className="art-meta">INDEPENDENT CONCEPT / {project.year}</span>
      <strong>
        {project.title.split(' / ')[0]}
        <i>®</i>
      </strong>
      <div className="art-rule" />
      <span className="art-caption">
        {project.category?.name} —{' '}
        {project.technologies
          .slice(0, 2)
          .map((t) => t.technology.name)
          .join(' + ')}
      </span>
    </div>
  );
}
export function ProjectGrid({
  projects,
  categories,
  all = false,
}: {
  projects: Project[];
  categories: Category[];
  all?: boolean;
}) {
  const [filter, setFilter] = useState('all');
  const shown = projects.filter(
    (p) => (all || p.featured) && (filter === 'all' || p.categoryId === filter),
  );
  return (
    <>
      <div className="work-toolbar">
        <div className="filters" role="group" aria-label="Filter projects">
          <button
            aria-pressed={filter === 'all'}
            className={filter === 'all' ? 'selected' : ''}
            onClick={() => setFilter('all')}
          >
            All work <sup>{projects.length.toString().padStart(2, '0')}</sup>
          </button>
          {categories
            .filter((c) => projects.some((p) => p.categoryId === c.id))
            .map((c) => (
              <button
                aria-pressed={filter === c.id}
                key={c.id}
                className={filter === c.id ? 'selected' : ''}
                onClick={() => setFilter(c.id)}
              >
                {c.name}
              </button>
            ))}
        </div>
        {!all && (
          <Link href="/projects" className="text-link">
            All projects <ArrowRight size={17} />
          </Link>
        )}
      </div>
      <div className="project-grid">
        {shown.map((p, i) => (
          <Link
            href={`/projects/${p.slug}`}
            key={p.id}
            className={`project-card project-${i}`}
            data-cursor="view"
            onPointerMove={(e) => {
              if (
                document.documentElement.dataset.motion === 'reduce' ||
                !matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)').matches
              )
                return;
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty(
                '--tilt',
                `${((e.clientX - r.left - r.width / 2) / r.width) * 3}deg`,
              );
            }}
            onPointerLeave={(e) => e.currentTarget.style.setProperty('--tilt', '0deg')}
          >
            <div className="project-cover">
              <ProjectArt project={p} index={i} />
              <span className="project-number">/{String(i + 1).padStart(2, '0')}</span>
              <span className="project-open">
                <ArrowUpRight />
              </span>
            </div>
            <div className="project-info">
              <div>
                <p className="eyebrow">
                  {p.category?.name} <span>·</span> {p.year}
                </p>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
              </div>
              <span className="project-arrow">
                <ArrowUpRight />
              </span>
            </div>
            <div className="tags">
              {p.technologies.slice(0, 4).map((t) => (
                <span key={t.technology.id}>{t.technology.name}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
      {!shown.length && <p className="empty">No projects in this category yet.</p>}
    </>
  );
}
