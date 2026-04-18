import { PageHeader } from '@/components/shared/page-header';
import { CustomerForm } from '../customer-form';
import { prisma } from '@/server/db';

export const metadata = { title: 'New customer' };

export default async function NewCustomerPage() {
  const [branches, categories] = await Promise.all([
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    }),
    prisma.customerCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Add New Customer"
        description="Create a customer profile for sales and receivables"
      />
      <CustomerForm mode="create" branches={branches} categories={categories} />
    </div>
  );
}
