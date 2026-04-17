import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { SupplierForm } from '../../supplier-form';
import { supplierService } from '@/server/services/supplier.service';
import { getSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { NotFoundError } from '@/lib/errors';

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  let supplier;
  try {
    supplier = await supplierService.getById(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title={`Edit ${supplier.name}`} description={supplier.code} />
      <SupplierForm
        mode="edit"
        branches={branches}
        initial={{
          id: supplier.id,
          branchId: supplier.branchId,
          name: supplier.name,
          contactPerson: supplier.contactPerson,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          city: supplier.city,
          country: supplier.country,
          taxId: supplier.taxId,
          paymentTerms: supplier.paymentTerms,
          currency: supplier.currency,
          openingBalance: supplier.openingBalance.toString(),
          status: supplier.status,
          notes: supplier.notes,
        }}
      />
    </div>
  );
}
