import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { CustomerForm } from '../../customer-form';
import { customerService } from '@/server/services/customer.service';
import { getSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { NotFoundError } from '@/lib/errors';

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  let customer;
  try {
    customer = await customerService.getById(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
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
      <PageHeader title={`Edit ${customer.name}`} description={customer.code} />
      <CustomerForm
        mode="edit"
        branches={branches}
        categories={categories}
        initial={{
          id: customer.id,
          branchId: customer.branchId,
          name: customer.name,
          type: customer.type,
          categoryId: customer.categoryId,
          contactPerson: customer.contactPerson,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          city: customer.city,
          country: customer.country,
          taxId: customer.taxId,
          creditLimit: customer.creditLimit.toString(),
          creditDays: customer.creditDays,
          currency: customer.currency,
          openingBalance: customer.openingBalance.toString(),
          status: customer.status,
          notes: customer.notes,
        }}
      />
    </div>
  );
}
