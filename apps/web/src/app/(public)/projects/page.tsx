import type { Metadata } from 'next';
import { getPortfolio, siteUrl } from '@/lib/server';
import { ProjectGrid } from '@/components/public/projects';
export const metadata: Metadata = {
  title: 'Selected work — Golam Rabbi',
  description: 'Explore WordPress, creative frontend, and full-stack case studies.',
  alternates: { canonical: `${siteUrl}/projects` },
};
export default async function ProjectsPage() {
  const { projects, categories } = await getPortfolio();
  return (
    <main id="main">
      <div className="page-header">
        <span className="eyebrow">A COLLECTION OF IDEAS, MADE REAL</span>
        <h1>Work with intention.</h1>
        <p>
          Thoughtful experiences. Distinct personalities. Explore the work and the thinking behind
          it.
        </p>
      </div>
      <section className="section" style={{ paddingTop: 15 }}>
        <ProjectGrid projects={projects} categories={categories} all />
      </section>
    </main>
  );
}
