import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { customerService } from '@/server/services/customer.service';
import { getSession } from '@/server/auth/session';
import { NotFoundError } from '@/lib/errors';
import { formatCurrency } from '@/lib/money';
import type { CurrencyCode } from '@/lib/money';

export default async function CustomerLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  let ledger;
  try {
    ledger = await customerService.getLedger(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const currency = ledger.customer.currency as CurrencyCode;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/crm/${ledger.customer.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <PageHeader
        title={`Ledger — ${ledger.customer.name}`}
        description={`${ledger.customer.code} · Current balance ${formatCurrency(ledger.currentBalance, currency)}`}
      />

      <Card className="p-0">
        <DataTable
          rows={ledger.entries}
          rowKey={(r) => r.id}
          empty="No ledger entries yet"
          columns={[
            {
              key: 'date',
              header: 'Date',
              cell: (r) => new Date(r.entryDate).toLocaleDateString(),
            },
            { key: 'type', header: 'Type', cell: (r) => r.entryType.toLowerCase() },
            { key: 'desc', header: 'Description', cell: (r) => r.description },
            {
              key: 'debit',
              header: 'Debit',
              align: 'right',
              cell: (r) =>
                r.debit.gt(0) ? (
                  <span className="tabular">{formatCurrency(r.debit, currency)}</span>
                ) : (
                  '—'
                ),
            },
            {
              key: 'credit',
              header: 'Credit',
              align: 'right',
              cell: (r) =>
                r.credit.gt(0) ? (
                  <span className="tabular text-emerald-600">
                    {formatCurrency(r.credit, currency)}
                  </span>
                ) : (
                  '—'
                ),
            },
            {
              key: 'balance',
              header: 'Balance',
              align: 'right',
              cell: (r) => (
                <span className="tabular font-medium">
                  {formatCurrency(r.runningBalance, currency)}
                </span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
