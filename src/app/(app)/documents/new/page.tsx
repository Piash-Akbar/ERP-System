import { PageHeader } from '@/components/shared/page-header';
import { prisma } from '@/server/db';
import { UploadForm } from './upload-form';

export const metadata = { title: 'Upload document' };

export default async function NewDocumentPage() {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Upload Document" description="Drop a file and tag it for later retrieval" />
      <UploadForm branches={branches} />
    </div>
  );
}
