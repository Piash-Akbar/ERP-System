import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { PaymentForm } from './payment-form';
import { supplierService } from '@/server/services/supplier.service';
import { getSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { NotFoundError } from '@/lib/errors';

export default async function SupplierPaymentPage({
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

  const openInvoices = await prisma.purchaseInvoice.findMany({
    where: {
      supplierId: supplier.id,
      status: { in: ['PENDING', 'PARTIALLY_PAID'] },
    },
    orderBy: { dueDate: 'asc' },
    select: {
      id: true,
      number: true,
      grandTotal: true,
      paidAmount: true,
      dueDate: true,
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Record Payment"
        description={`${supplier.name} (${supplier.code})`}
      />
      <PaymentForm
        supplierId={supplier.id}
        supplierName={supplier.name}
        openInvoices={openInvoices.map((i) => ({
          id: i.id,
          number: i.number,
          grandTotal: i.grandTotal.toString(),
          paidAmount: i.paidAmount.toString(),
          dueDate: i.dueDate.toISOString(),
        }))}
      />
    </div>
  );
}
