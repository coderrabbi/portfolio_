import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject, getPortfolio, siteUrl } from '@/lib/server';
import { CaseStudy } from '@/components/public/case-study';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params,
    p = await getProject(slug);
  if (!p) return { title: 'Project not found', robots: { index: false } };
  const title = p.seoTitle || p.title,
    description = p.seoDescription || p.excerpt,
    url = `${siteUrl}/projects/${p.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: p.coverImage ? [new URL(p.coverImage, siteUrl).href] : [],
    },
    twitter: {
      card: p.coverImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: p.coverImage ? [new URL(p.coverImage, siteUrl).href] : [],
    },
  };
}
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    p = await getProject(slug);
  if (!p) notFound();
  const { projects } = await getPortfolio(),
    i = projects.findIndex((v) => v.id === p.id),
    previous = projects[i - 1],
    next = projects[i + 1];
  const json = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    description: p.excerpt,
    url: `${siteUrl}/projects/${p.slug}`,
    dateModified: p.updatedAt,
  };
  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, '\\u003c') }}
      />
      <CaseStudy project={p} />
      <nav className="project-pagination" aria-label="Project navigation">
        {previous ? (
          <Link href={`/projects/${previous.slug}`}>
            <span>← PREVIOUS PROJECT</span>
            {previous.title}
          </Link>
        ) : (
          <Link href="/projects">
            <span>← BACK TO ALL WORK</span>Explore the collection
          </Link>
        )}
        {next && (
          <Link href={`/projects/${next.slug}`}>
            <span>NEXT PROJECT →</span>
            {next.title}
          </Link>
        )}
      </nav>
    </main>
  );
}
