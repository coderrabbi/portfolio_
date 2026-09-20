import { notFound } from 'next/navigation';
import { ResourceManager } from '@/components/admin/resources';
export default async function ResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!['categories', 'services', 'skills', 'experience', 'testimonials'].includes(resource))
    notFound();
  return <ResourceManager resource={resource} />;
}
