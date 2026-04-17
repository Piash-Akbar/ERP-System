import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/shared/kpi-card';
import { DataTable } from '@/components/shared/data-table';
import { Pill } from '@/components/shared/pill';
import { AlertBanner } from '@/components/shared/alert-banner';
import { supplierService } from '@/server/services/supplier.service';
import { getSession } from '@/server/auth/session';
import { NotFoundError } from '@/lib/errors';
import { formatCurrency } from '@/lib/money';
import type { CurrencyCode } from '@/lib/money';

export default async function SupplierLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  let data;
  try {
    data = await supplierService.getLedger(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const currency = data.supplier.currency as CurrencyCode;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/suppliers/${data.supplier.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Supplier Ledger"
        description="Complete transaction history and running balance"
      />

      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <p className="text-xs text-muted-foreground">Supplier</p>
            <p className="text-lg font-semibold">{data.supplier.name}</p>
            <p className="text-xs text-muted-foreground tabular">{data.supplier.code}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {data.supplier.paymentTerms.replace('_', ' ')} · {currency}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total Debit (Purchases)"
          value={formatCurrency(data.totalDebit, currency)}
          tone="danger"
        />
        <KpiCard
          label="Total Credit (Payments)"
          value={formatCurrency(data.totalCredit, currency)}
          tone="success"
        />
        <KpiCard
          label="Current Balance"
          value={formatCurrency(data.currentBalance, currency)}
          tone={data.currentBalance.gt(0) ? 'danger' : 'success'}
          description={data.currentBalance.gt(0) ? 'Amount payable' : 'Cleared'}
        />
      </div>

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Ledger Entries ({data.entries.length} transactions)
        </div>
        <DataTable
          rows={data.entries}
          rowKey={(r) => r.id}
          empty="No ledger entries"
          columns={[
            {
              key: 'date',
              header: 'Date',
              cell: (r) => new Date(r.entryDate).toLocaleDateString(),
            },
            {
              key: 'type',
              header: 'Type',
              cell: (r) => (
                <Pill
                  tone={
                    r.entryType === 'PURCHASE'
                      ? 'red'
                      : r.entryType === 'PAYMENT'
                        ? 'green'
                        : r.entryType === 'OPENING'
                          ? 'blue'
                          : 'neutral'
                  }
                >
                  {r.entryType.toLowerCase()}
                </Pill>
              ),
            },
            { key: 'description', header: 'Description', cell: (r) => r.description },
            { key: 'ref', header: 'Reference', cell: (r) => (
              <span className="tabular text-muted-foreground">{r.refType}</span>
            ) },
            {
              key: 'debit',
              header: 'Debit (+)',
              align: 'right',
              cell: (r) => (
                <span className="tabular text-red-600">
                  {r.debit.gt(0) ? formatCurrency(r.debit, currency) : '-'}
                </span>
              ),
            },
            {
              key: 'credit',
              header: 'Credit (-)',
              align: 'right',
              cell: (r) => (
                <span className="tabular text-emerald-600">
                  {r.credit.gt(0) ? formatCurrency(r.credit, currency) : '-'}
                </span>
              ),
            },
            {
              key: 'balance',
              header: 'Running Balance',
              align: 'right',
              cell: (r) => (
                <span className="tabular font-medium">
                  {formatCurrency(r.runningBalance, currency)}
                </span>
              ),
              headerClassName: 'bg-muted/40',
              className: 'bg-muted/20',
            },
          ]}
        />
      </Card>

      <AlertBanner tone="info" title="Understanding the Ledger">
        <ul className="mt-1 space-y-0.5 text-sm">
          <li>
            • <strong>Debit (Red):</strong> Purchases and expenses — increases your payable to the
            supplier
          </li>
          <li>
            • <strong>Credit (Green):</strong> Payments made — reduces your payable to the supplier
          </li>
          <li>
            • <strong>Running Balance:</strong> Current outstanding amount you owe the supplier
          </li>
        </ul>
      </AlertBanner>
    </div>
  );
}
