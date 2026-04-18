import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/shared/pill';
import { DataTable } from '@/components/shared/data-table';
import { prisma } from '@/server/db';
import { assetService } from '@/server/services/asset.service';
import { getSession } from '@/server/auth/session';
import { NotFoundError } from '@/lib/errors';
import { formatCurrency } from '@/lib/money';
import type { CurrencyCode } from '@/lib/money';
import { ASSET_STATUS } from '@/server/validators/assets';
import { AssetActions } from './asset-actions';

export const metadata = { title: 'Asset' };

type PillTone = 'neutral' | 'grey' | 'blue' | 'amber' | 'green' | 'red' | 'orange';

const STATUS_TONE: Record<(typeof ASSET_STATUS)[number], PillTone> = {
  IN_USE: 'green',
  IN_STORAGE: 'blue',
  UNDER_MAINTENANCE: 'amber',
  DISPOSED: 'red',
  LOST: 'red',
};

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  let asset: Awaited<ReturnType<typeof assetService.getById>>;
  try {
    asset = await assetService.getById(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });

  const currency = asset.branch.currency as CurrencyCode;

  return (
    <div className="space-y-6">
      <PageHeader title={`${asset.code} — ${asset.name}`}>
        <Button variant="outline" asChild>
          <Link href="/assets">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/assets/${asset.id}/edit`}>Edit</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <Card className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Status</div>
              <Pill tone={STATUS_TONE[asset.status]}>
                {asset.status.replace('_', ' ').toLowerCase()}
              </Pill>
            </div>
            <div>
              <div className="text-muted-foreground">Condition</div>
              <div>{asset.condition.toLowerCase()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Category</div>
              <div>{asset.category?.name ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Branch</div>
              <div>{asset.branch.name}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Location</div>
              <div>{asset.location ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Assigned to</div>
              <div>{asset.assignedTo ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Serial</div>
              <div className="tabular">{asset.serialNumber ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Purchase date</div>
              <div className="tabular">{asset.purchaseDate.toISOString().slice(0, 10)}</div>
            </div>
          </Card>

          <Card className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Purchase cost</div>
              <div className="tabular font-semibold">
                {formatCurrency(asset.purchaseCost, currency)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Salvage value</div>
              <div className="tabular">{formatCurrency(asset.salvageValue, currency)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Accumulated depr.</div>
              <div className="tabular text-red-600">
                {formatCurrency(asset.accumulatedDepreciation, currency)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Book value</div>
              <div className="tabular font-semibold text-emerald-600">
                {formatCurrency(asset.bookValue, currency)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Method</div>
              <div>{asset.depreciationMethod.replace('_', ' ').toLowerCase()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Useful life</div>
              <div className="tabular">{asset.usefulLifeMonths} months</div>
            </div>
            <div>
              <div className="text-muted-foreground">Last depreciated</div>
              <div className="tabular">
                {asset.lastDepreciatedAt?.toISOString().slice(0, 10) ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Disposed</div>
              <div className="tabular">
                {asset.disposedAt?.toISOString().slice(0, 10) ?? '—'}
              </div>
            </div>
          </Card>

          <Card className="p-0">
            <div className="px-4 py-3 border-b text-sm font-medium">Movement history</div>
            <DataTable
              rows={asset.movements}
              rowKey={(r) => r.id}
              empty="No movements recorded."
              columns={[
                {
                  key: 'date',
                  header: 'Date',
                  cell: (r) => r.createdAt.toISOString().slice(0, 10),
                },
                { key: 'type', header: 'Type', cell: (r) => r.type.toLowerCase() },
                {
                  key: 'from',
                  header: 'From',
                  cell: (r) => r.fromLocation ?? r.fromAssignee ?? '—',
                },
                {
                  key: 'to',
                  header: 'To',
                  cell: (r) => r.toLocation ?? r.toAssignee ?? '—',
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  align: 'right',
                  cell: (r) =>
                    r.amount ? (
                      <span className="tabular">{formatCurrency(r.amount, currency)}</span>
                    ) : (
                      '—'
                    ),
                },
                { key: 'note', header: 'Note', cell: (r) => r.note ?? '—' },
              ]}
            />
          </Card>
        </div>

        <AssetActions asset={{ id: asset.id, status: asset.status }} branches={branches} />
      </div>
    </div>
  );
}
