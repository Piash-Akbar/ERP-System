import { PageHeader } from '@/components/shared/page-header';
import { SupplierForm } from '../supplier-form';
import { prisma } from '@/server/db';

export const metadata = { title: 'New supplier' };

export default async function NewSupplierPage() {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Add New Supplier"
        description="Create a supplier profile for procurement and payables"
      />
      <SupplierForm mode="create" branches={branches} />
    </div>
  );
}
