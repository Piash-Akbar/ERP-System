import Link from 'next/link';
import { Plus, Eye } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/shared/pill';
import { DataTable } from '@/components/shared/data-table';
import { StepIndicator } from '@/components/shared/step-indicator';
import { AlertBanner } from '@/components/shared/alert-banner';
import { purchaseService } from '@/server/services/purchase.service';
import { getSession } from '@/server/auth/session';
import { formatCurrency } from '@/lib/money';

export const metadata = { title: 'Purchase Invoices' };

const STATUS_TONE = {
  PENDING: 'amber',
  PARTIALLY_PAID: 'orange',
  PAID: 'green',
  CANCELLED: 'red',
} as const;

export default async function InvoicesPage() {
  const session = await getSession();
  const invoices = await purchaseService.listInvoices(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Invoice"
        description="Record and match supplier invoices"
      >
        <Button variant="dark" asChild>
          <Link href="/purchase/invoices/new">
            <Plus className="h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </PageHeader>

      <AlertBanner tone="info" title="3-Way Matching">
        Invoices are automatically matched with Purchase Orders and GRN records to ensure
        accuracy and prevent discrepancies.
      </AlertBanner>

      <StepIndicator
        steps={[
          { key: 'pr', label: 'PR', state: 'completed' },
          { key: 'po', label: 'PO', state: 'completed' },
          { key: 'grn', label: 'GRN', state: 'completed' },
          { key: 'invoice', label: 'Invoice', state: 'active' },
          { key: 'payment', label: 'Payment', state: 'pending' },
        ]}
      />

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium">All Invoices ({invoices.length})</div>
        <DataTable
          rows={invoices}
          rowKey={(r) => r.id}
          empty="No invoices yet."
          columns={[
            {
              key: 'number',
              header: 'Invoice #',
              cell: (r) => (
                <Link
                  href={`/purchase/invoices/${r.id}`}
                  className="text-blue-600 hover:underline tabular"
                >
                  {r.number}
                </Link>
              ),
            },
            {
              key: 'supplier',
              header: 'Supplier',
              cell: (r) => (
                <Link href={`/suppliers/${r.supplier.id}`} className="text-blue-600 hover:underline">
                  {r.supplier.name}
                </Link>
              ),
            },
            {
              key: 'po',
              header: 'PO Ref',
              cell: (r) =>
                r.purchaseOrder ? (
                  <Link
                    href={`/purchase/orders/${r.purchaseOrder.id}`}
                    className="text-blue-600 hover:underline tabular"
                  >
                    {r.purchaseOrder.number}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            {
              key: 'grn',
              header: 'GRN Ref',
              cell: (r) =>
                r.grn ? <span className="tabular">{r.grn.number}</span> : <span className="text-muted-foreground">—</span>,
            },
            {
              key: 'amount',
              header: 'Amount',
              align: 'right',
              cell: (r) => <span className="tabular">{formatCurrency(r.subtotal, r.currency)}</span>,
            },
            {
              key: 'tax',
              header: 'Tax',
              align: 'right',
              cell: (r) => <span className="tabular">{formatCurrency(r.taxTotal, r.currency)}</span>,
            },
            {
              key: 'total',
              header: 'Total',
              align: 'right',
              cell: (r) => (
                <span className="tabular font-medium">{formatCurrency(r.grandTotal, r.currency)}</span>
              ),
            },
            {
              key: 'due',
              header: 'Due Date',
              cell: (r) => new Date(r.dueDate).toLocaleDateString(),
            },
            {
              key: 'matching',
              header: 'Matching',
              cell: (r) => (
                <Pill tone={r.matching === 'MATCHED' ? 'green' : r.matching === 'DISPUTED' ? 'red' : 'grey'}>
                  {r.matching.toLowerCase()}
                </Pill>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r) => (
                <Pill tone={STATUS_TONE[r.status as keyof typeof STATUS_TONE] ?? 'neutral'}>
                  {r.status.replace('_', ' ').toLowerCase()}
                </Pill>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              cell: (r) => (
                <Link
                  href={`/purchase/invoices/${r.id}`}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
