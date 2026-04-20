import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { authorize } from '@/server/auth/authorize';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/shared/page-header';
import { NewTradeOrderForm } from '@/components/trade/new-trade-order-form';

export const metadata = { title: 'New Trade Order' };

export default async function NewTradeOrderPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  await authorize(session, 'trade:write');

  const branchId = session.activeBranchId;

  const [branches, customers, suppliers] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, select: { id: true, name: true, code: true } }),
    prisma.customer.findMany({
      where: { status: 'ACTIVE', type: { in: ['EXPORT', 'CORPORATE'] } },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
    prisma.supplier.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="New Trade Order" description="Create an export or import order." />
      <NewTradeOrderForm
        defaultBranchId={branchId ?? branches[0]?.id ?? ''}
        branches={branches}
        customers={customers}
        suppliers={suppliers}
      />
    </div>
  );
}
