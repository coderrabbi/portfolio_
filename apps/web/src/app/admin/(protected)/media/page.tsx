import { MediaLibrary } from '@/components/admin/media-library';
import { PageTitle } from '@/components/admin/ui';
export default function MediaPage() {
  return (
    <>
      <PageTitle
        title="A library of possibilities."
        description="Upload, organize, and reuse your project images."
      />
      <MediaLibrary />
    </>
  );
}
