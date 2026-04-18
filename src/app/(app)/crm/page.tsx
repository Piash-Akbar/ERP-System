import Link from 'next/link';
import { Mail, Phone, MapPin, Plus, Eye } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/data-table';
import { Pill } from '@/components/shared/pill';
import { customerService } from '@/server/services/customer.service';
import { getSession } from '@/server/auth/session';
import { formatCurrency } from '@/lib/money';
import type { CurrencyCode } from '@/lib/money';

export const metadata = { title: 'Customers' };

interface Search {
  status?: string;
  type?: string;
  search?: string;
}

export default async function CRMPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  const customers = await customerService.list(session, {
    status: sp.status && sp.status !== 'ALL' ? sp.status : undefined,
    type: sp.type && sp.type !== 'ALL' ? sp.type : undefined,
    search: sp.search,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Customer List" description="Manage all your customers">
        <Button variant="dark" asChild>
          <Link href="/crm/new">
            <Plus className="h-4 w-4" />
            Add New Customer
          </Link>
        </Button>
      </PageHeader>

      <Card className="p-4">
        <form className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px_160px_auto] gap-3 items-end">
          <div>
            <Input
              name="search"
              placeholder="Search by name, contact, email or phone…"
              defaultValue={sp.search ?? ''}
            />
          </div>
          <div>
            <select
              name="type"
              defaultValue={sp.type ?? 'ALL'}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="ALL">All types</option>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="CORPORATE">Corporate</option>
              <option value="ONLINE">Online</option>
              <option value="EXPORT">Export</option>
            </select>
          </div>
          <div>
            <select
              name="status"
              defaultValue={sp.status ?? 'ALL'}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
          <Button type="submit" variant="outline">
            Filter
          </Button>
          <div />
        </form>
      </Card>

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium">
          {customers.length} Customer{customers.length === 1 ? '' : 's'}
        </div>
        <DataTable
          rows={customers}
          rowKey={(r) => r.id}
          empty="No customers yet. Add your first customer to start selling."
          columns={[
            {
              key: 'code',
              header: 'Customer ID',
              cell: (r) => <span className="tabular">{r.code}</span>,
            },
            {
              key: 'name',
              header: 'Name',
              cell: (r) => (
                <Link href={`/crm/${r.id}`} className="text-blue-600 hover:underline">
                  {r.name}
                </Link>
              ),
            },
            {
              key: 'type',
              header: 'Type',
              cell: (r) => (
                <Pill tone="grey">{r.type.toLowerCase()}</Pill>
              ),
            },
            {
              key: 'contact',
              header: 'Phone / Email',
              cell: (r) => (
                <div className="space-y-0.5 text-xs">
                  {r.phone && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{r.phone}</span>
                    </div>
                  )}
                  {r.email && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{r.email}</span>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'location',
              header: 'Location',
              cell: (r) => (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{r.city ?? r.country ?? '—'}</span>
                </div>
              ),
            },
            {
              key: 'totalSales',
              header: 'Total Sales',
              align: 'right',
              cell: (r) => (
                <span className="tabular">
                  {formatCurrency(r.totalSales, r.currency as CurrencyCode)}
                </span>
              ),
            },
            {
              key: 'due',
              header: 'Due',
              align: 'right',
              cell: (r) => {
                const isDue = r.dueAmount.gt(0);
                return (
                  <span
                    className={`tabular font-medium ${isDue ? 'text-red-600' : 'text-emerald-600'}`}
                  >
                    {formatCurrency(r.dueAmount, r.currency as CurrencyCode)}
                  </span>
                );
              },
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r) => (
                <Pill
                  tone={r.status === 'ACTIVE' ? 'black' : r.status === 'BLOCKED' ? 'red' : 'grey'}
                >
                  {r.status.toLowerCase()}
                </Pill>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              cell: (r) => (
                <Link
                  href={`/crm/${r.id}`}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Link>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
