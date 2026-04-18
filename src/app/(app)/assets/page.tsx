import Link from 'next/link';
import { Plus, Wrench, Package, CheckCircle2, Ban } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/data-table';
import { Pill } from '@/components/shared/pill';
import { KpiCard } from '@/components/shared/kpi-card';
import { assetService } from '@/server/services/asset.service';
import { getSession } from '@/server/auth/session';
import { formatCurrency } from '@/lib/money';
import type { CurrencyCode } from '@/lib/money';
import { ASSET_STATUS } from '@/server/validators/assets';

export const metadata = { title: 'Assets' };

type PillTone = 'neutral' | 'grey' | 'blue' | 'amber' | 'green' | 'red' | 'orange';

const STATUS_TONE: Record<(typeof ASSET_STATUS)[number], PillTone> = {
  IN_USE: 'green',
  IN_STORAGE: 'blue',
  UNDER_MAINTENANCE: 'amber',
  DISPOSED: 'red',
  LOST: 'red',
};

interface Search {
  status?: string;
  search?: string;
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  const [assets, summary] = await Promise.all([
    assetService.list(session, {
      status: sp.status && sp.status !== 'ALL' ? sp.status : undefined,
      search: sp.search,
    }),
    assetService.summary(session),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Assets" description="Track, transfer, depreciate, and dispose assets">
        <Button variant="outline" asChild>
          <Link href="/assets/categories">Categories</Link>
        </Button>
        <Button variant="dark" asChild>
          <Link href="/assets/new">
            <Plus className="h-4 w-4" /> Add Asset
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="In use" value={summary.inUse} icon={CheckCircle2} tone="success" />
        <KpiCard label="In storage" value={summary.storage} icon={Package} tone="primary" />
        <KpiCard label="Maintenance" value={summary.maintenance} icon={Wrench} tone="warning" />
        <KpiCard label="Disposed" value={summary.disposed} icon={Ban} tone="danger" />
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Total purchase</div>
            <div className="tabular font-semibold">
              {formatCurrency(summary.totalPurchase, 'BDT')}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Accumulated depreciation</div>
            <div className="tabular font-semibold text-red-600">
              {formatCurrency(summary.totalAccumulated, 'BDT')}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Net book value</div>
            <div className="tabular font-semibold text-emerald-600">
              {formatCurrency(summary.netBookValue, 'BDT')}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <form className="grid grid-cols-1 md:grid-cols-[1fr_220px_160px_auto] gap-3 items-end">
          <Input
            name="search"
            placeholder="Search by code, name, serial…"
            defaultValue={sp.search ?? ''}
          />
          <select
            name="status"
            defaultValue={sp.status ?? 'ALL'}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="ALL">All statuses</option>
            {ASSET_STATUS.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline">
            Filter
          </Button>
          <div />
        </form>
      </Card>

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium">
          {assets.length} Asset{assets.length === 1 ? '' : 's'}
        </div>
        <DataTable
          rows={assets}
          rowKey={(r) => r.id}
          empty="No assets yet."
          columns={[
            { key: 'code', header: 'Code', cell: (r) => <span className="tabular">{r.code}</span> },
            {
              key: 'name',
              header: 'Name',
              cell: (r) => (
                <Link href={`/assets/${r.id}`} className="text-blue-600 hover:underline">
                  {r.name}
                </Link>
              ),
            },
            { key: 'category', header: 'Category', cell: (r) => r.category?.name ?? '—' },
            { key: 'branch', header: 'Branch', cell: (r) => r.branch.name },
            { key: 'location', header: 'Location', cell: (r) => r.location ?? '—' },
            { key: 'assignee', header: 'Assigned to', cell: (r) => r.assignedTo ?? '—' },
            {
              key: 'cost',
              header: 'Purchase',
              align: 'right',
              cell: (r) => (
                <span className="tabular">
                  {formatCurrency(r.purchaseCost, r.branch.currency as CurrencyCode)}
                </span>
              ),
            },
            {
              key: 'nbv',
              header: 'Book value',
              align: 'right',
              cell: (r) => (
                <span className="tabular font-medium">
                  {formatCurrency(r.bookValue, r.branch.currency as CurrencyCode)}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r) => (
                <Pill tone={STATUS_TONE[r.status]}>
                  {r.status.replace('_', ' ').toLowerCase()}
                </Pill>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
