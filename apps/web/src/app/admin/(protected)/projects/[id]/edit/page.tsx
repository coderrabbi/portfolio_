import { ProjectEditor } from '@/components/admin/project-editor';
export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectEditor id={id} />;
}
