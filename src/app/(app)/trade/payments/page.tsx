import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { getSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { formatCurrency } from '@/lib/money';

export const metadata = { title: 'Foreign Payments' };

type Row = Awaited<ReturnType<typeof fetchPayments>>[number];

async function fetchPayments(branchId?: string) {
  return prisma.tradePayment.findMany({
    where: { branchId },
    include: { tradeOrder: { select: { id: true, number: true, type: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

const columns: DataTableColumn<Row>[] = [
  {
    key: 'number', header: 'Payment #',
    cell: (r) => <span className="font-mono text-sm">{r.number}</span>,
  },
  {
    key: 'order', header: 'Trade Order',
    cell: (r) => (
      <Link href={`/trade/orders/${r.tradeOrder.id}`} className="text-primary hover:underline text-sm font-mono">
        {r.tradeOrder.number}
      </Link>
    ),
  },
  {
    key: 'amount', header: 'Amount', align: 'right',
    cell: (r) => formatCurrency(r.amount.toString(), r.currency),
  },
  {
    key: 'rate', header: 'Rate', align: 'right',
    cell: (r) => <span className="tabular-nums text-xs">{r.exchangeRate.toString()}</span>,
  },
  {
    key: 'local', header: 'Local (BDT)', align: 'right',
    cell: (r) => formatCurrency(r.localAmount.toString(), 'BDT'),
  },
  { key: 'bank', header: 'Bank', cell: (r) => r.bankName ?? '—' },
  {
    key: 'swift', header: 'SWIFT Ref',
    cell: (r) => <span className="font-mono text-xs">{r.swiftRef ?? '—'}</span>,
  },
  {
    key: 'date', header: 'Payment Date',
    cell: (r) => r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : '—',
  },
];

export default async function TradePaymentsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  await authorize(session, 'trade:read');

  const rows = await fetchPayments(session.activeBranchId ?? undefined);

  return (
    <div className="space-y-6">
      <PageHeader title="Foreign Payments" description="SWIFT/TT payments with exchange rate tracking." />
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} empty="No payments recorded." />
    </div>
  );
}
