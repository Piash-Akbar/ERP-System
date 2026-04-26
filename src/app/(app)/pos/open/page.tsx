import { redirect } from 'next/navigation';
import { prisma } from '@/server/db';
import { getSession } from '@/server/auth/session';
import { OpenSessionForm } from './open-session-form';

export const metadata = { title: 'Open POS Session' };

export default async function OpenSessionPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const existing = await prisma.posSession.findFirst({
    where: { cashierId: session.userId, status: 'OPEN' },
  });
  if (existing) redirect('/pos');

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true, currency: true },
  });
  const warehouses = await prisma.warehouse.findMany({
    where: { isActive: true, type: { in: ['STORE', 'SHOWROOM', 'MAIN'] } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true, branchId: true },
  });

  const defaultBranch = session.activeBranchId ?? branches[0]?.id ?? '';

  const lastClosed = await prisma.posSession.findFirst({
    where: { cashierId: session.userId, status: 'CLOSED' },
    orderBy: { closedAt: 'desc' },
    select: { countedCash: true },
  });
  const defaultOpeningBalance = lastClosed ? lastClosed.countedCash.toString() : '0';

  return (
    <OpenSessionForm
      branches={branches}
      warehouses={warehouses}
      defaultBranch={defaultBranch}
      defaultOpeningBalance={defaultOpeningBalance}
      carriedFromPrevious={!!lastClosed}
    />
  );
}
