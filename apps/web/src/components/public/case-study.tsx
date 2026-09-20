import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';
import type { Project } from '@gr/shared';
import { ProjectArt } from './projects';
export function CaseStudy({
  project: p,
  preview = false,
}: {
  project: Project;
  preview?: boolean;
}) {
  return (
    <>
      <div className="page-header">
        {preview && (
          <div className="admin-notice">
            Private preview ·{' '}
            {p.published ? 'Published project' : 'Draft — not visible on the public portfolio'}
          </div>
        )}
        <Link href={preview ? `/admin/projects/${p.id}/edit` : '/projects'} className="text-link">
          <ArrowLeft size={16} />
          {preview ? 'Back to editor' : 'All projects'}
        </Link>
        <p className="eyebrow" style={{ marginTop: 35 }}>
          {p.category?.name || p.projectType} / {p.year}
        </p>
        <h1>{p.title}</h1>
        <p>{p.excerpt}</p>
        <div className="case-links">
          {p.liveUrl && (
            <a className="button primary" target="_blank" rel="noreferrer" href={p.liveUrl}>
              Visit website
              <ArrowUpRight size={17} />
            </a>
          )}
          {p.githubUrl && (
            <a className="button" target="_blank" rel="noreferrer" href={p.githubUrl}>
              View source
              <ArrowUpRight size={17} />
            </a>
          )}
        </div>
      </div>
      <div className="case-cover">
        {p.coverImage ? (
          <Image src={p.coverImage} alt={`${p.title} cover`} fill priority sizes="90vw" />
        ) : (
          <ProjectArt project={p} />
        )}
      </div>
      <div className="case-content">
        <dl className="case-meta">
          {[
            ['Client', p.client || 'Independent project'],
            ['Role', p.role || 'Development'],
            ['Year', String(p.year)],
            ['Category', p.category?.name || p.projectType],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>
                <span>{label}</span>
              </dt>
              <dd style={{ margin: 0 }}>
                <b>{value}</b>
              </dd>
            </div>
          ))}
        </dl>
        {p.description && (
          <section>
            <h2>The overview</h2>
            <p>{p.description}</p>
          </section>
        )}
        <div className="tags">
          {p.technologies.map((t) => (
            <span key={t.technology.id}>{t.technology.name}</span>
          ))}
        </div>
        {p.content.map((block, i) => (
          <section className="case-block" key={i}>
            <span className="eyebrow">0{i + 1} / THE STORY</span>
            <h2>{block.title}</h2>
            <p>{block.body}</p>
          </section>
        ))}
      </div>
      {p.videoUrl && (
        <div className="case-video">
          <video controls preload="metadata" poster={p.coverImage || undefined}>
            <source src={p.videoUrl} />
            Your browser does not support video. <a href={p.videoUrl}>Open the demo</a>
          </video>
        </div>
      )}
      <div className="case-gallery">
        {p.gallery.map((g) => (
          <figure key={g.id} className={g.layout}>
            <Image
              src={g.media.url}
              alt={g.media.alt || p.title}
              fill
              sizes={g.layout === 'full-width' ? '90vw' : '(max-width: 760px) 90vw, 45vw'}
            />
          </figure>
        ))}
      </div>
    </>
  );
}
