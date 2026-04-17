import { PageHeader } from '@/components/shared/page-header';
import { RequisitionForm } from '../requisition-form';
import { prisma } from '@/server/db';

export const metadata = { title: 'New Purchase Requisition' };

export default async function NewRequisitionPage() {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Create Purchase Requisition"
        description="Raise a PR for approval before converting it to a PO"
      />
      <RequisitionForm branches={branches} />
    </div>
  );
}
