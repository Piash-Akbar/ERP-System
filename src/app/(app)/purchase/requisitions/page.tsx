import Link from 'next/link';
import { Plus, Eye } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/shared/pill';
import { DataTable } from '@/components/shared/data-table';
import { purchaseService } from '@/server/services/purchase.service';
import { getSession } from '@/server/auth/session';

export const metadata = { title: 'Purchase Requisitions' };

const PRIORITY_TONE: Record<string, 'red' | 'orange' | 'blue' | 'amber'> = {
  URGENT: 'red',
  HIGH: 'red',
  MEDIUM: 'orange',
  LOW: 'blue',
};

const STATUS_TONE: Record<string, 'amber' | 'green' | 'red' | 'blue' | 'grey'> = {
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  DRAFT: 'blue',
  CANCELLED: 'grey',
  CLOSED: 'grey',
};

export default async function RequisitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  const requisitions = await purchaseService.listRequisitions(session, {
    status: sp.status && sp.status !== 'ALL' ? sp.status : undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Requisition"
        description="Create and manage purchase requisitions"
      >
        <Button variant="dark" asChild>
          <Link href="/purchase/requisitions/new">
            <Plus className="h-4 w-4" />
            Create Requisition
          </Link>
        </Button>
      </PageHeader>

      <Card className="p-4">
        <form className="flex items-end gap-3">
          <select
            name="status"
            defaultValue={sp.status ?? 'ALL'}
            className="flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Draft</option>
            <option value="CLOSED">Closed</option>
          </select>
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </form>
      </Card>

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium">
          All Requisitions ({requisitions.length})
        </div>
        <DataTable
          rows={requisitions}
          rowKey={(r) => r.id}
          empty="No requisitions yet."
          columns={[
            {
              key: 'number',
              header: 'PR ID',
              cell: (r) => (
                <Link
                  href={`/purchase/requisitions/${r.id}`}
                  className="text-blue-600 hover:underline tabular"
                >
                  {r.number}
                </Link>
              ),
            },
            { key: 'department', header: 'Department', cell: (r) => r.department },
            { key: 'requestedBy', header: 'Requested By', cell: (r) => r.requestedBy },
            {
              key: 'items',
              header: 'Items',
              cell: (r) => `${r.items.length} items`,
            },
            {
              key: 'requiredDate',
              header: 'Required Date',
              cell: (r) => new Date(r.requiredDate).toLocaleDateString(),
            },
            {
              key: 'priority',
              header: 'Priority',
              cell: (r) => (
                <Pill tone={PRIORITY_TONE[r.priority] ?? 'neutral'}>{r.priority.toLowerCase()}</Pill>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r) => (
                <Pill tone={STATUS_TONE[r.status] ?? 'neutral'}>
                  {r.status.replace('_', ' ').toLowerCase()}
                </Pill>
              ),
            },
            {
              key: 'created',
              header: 'Created',
              cell: (r) => new Date(r.createdAt).toLocaleDateString(),
            },
            {
              key: 'actions',
              header: 'Actions',
              cell: (r) => (
                <Link
                  href={`/purchase/requisitions/${r.id}`}
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
