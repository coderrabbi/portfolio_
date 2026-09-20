import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Project } from '@gr/shared';
import { CaseStudy } from '@/components/public/case-study';
export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params,
    jar = await cookies(),
    session = jar.get('__Host-gr_session') || jar.get('gr_session');
  const res = await fetch(
    `${process.env.BACKEND_URL || 'http://127.0.0.1:4000'}/api/projects/${id}`,
    { headers: { cookie: session ? `${session.name}=${session.value}` : '' }, cache: 'no-store' },
  );
  if (!res.ok) notFound();
  const { data }: { data: Project } = await res.json();
  return <CaseStudy project={data} preview />;
}
