import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { authorize } from '@/server/auth/authorize';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/shared/page-header';
import { IssueLCForm } from '@/components/trade/issue-lc-form';

export const metadata = { title: 'Issue Letter of Credit' };

export default async function IssueLCPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams;
  const session = await getSession();
  if (!session) redirect('/login');
  await authorize(session, 'trade:lc-issue');

  const [orders, branches] = await Promise.all([
    prisma.tradeOrder.findMany({
      where: {
        lc: null,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
        branchId: session.activeBranchId ?? undefined,
      },
      select: { id: true, number: true, type: true, currency: true, totalValue: true, portOfLoading: true, portOfDischarge: true, goodsDescription: true, latestShipDate: true, customer: { select: { name: true } }, supplier: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.branch.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ]);

  const serializedOrders = orders.map((o) => ({ ...o, totalValue: o.totalValue.toNumber() }));

  return (
    <div className="space-y-6">
      <PageHeader title="Issue Letter of Credit" description="Open an LC linked to a trade order (SWIFT MT 700)." />
      <IssueLCForm
        orders={serializedOrders}
        branches={branches}
        defaultBranchId={session.activeBranchId ?? branches[0]?.id ?? ''}
        preselectedOrderId={orderId}
      />
    </div>
  );
}
