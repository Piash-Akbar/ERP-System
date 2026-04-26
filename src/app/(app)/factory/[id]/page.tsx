import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Prisma } from '@prisma/client';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { Pill } from '@/components/shared/pill';
import { prisma } from '@/server/db';
import { factoryService, getCostSummary } from '@/server/services/factory.service';
import { getSession } from '@/server/auth/session';
import { NotFoundError } from '@/lib/errors';
import { PRODUCTION_ORDER_STATUS } from '@/server/validators/factory';
import { ProductionControls } from './production-controls';
import { DeleteCostEntryButton } from './delete-cost-entry-button';

export const metadata = { title: 'Production order' };

type PillTone = 'neutral' | 'grey' | 'blue' | 'amber' | 'green' | 'red' | 'orange';

const STATUS_TONE: Record<(typeof PRODUCTION_ORDER_STATUS)[number], PillTone> = {
  DRAFT: 'grey',
  PLANNED: 'blue',
  IN_PROGRESS: 'amber',
  COMPLETED: 'green',
  CANCELLED: 'red',
  ON_HOLD: 'orange',
};

const STAGE_TONE: Record<string, PillTone> = {
  PENDING: 'grey',
  IN_PROGRESS: 'amber',
  COMPLETED: 'green',
  SKIPPED: 'neutral',
};

function CostRow({ label, value }: { label: string; value: Prisma.Decimal }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium">{value.toFixed(2)}</span>
    </div>
  );
}

export default async function ProductionOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  let order: Awaited<ReturnType<typeof factoryService.getById>>;
  try {
    order = await factoryService.getById(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const warehouses = await prisma.warehouse.findMany({
    where: { branchId: order.branchId, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, code: true, name: true },
  });

  const costSummary = getCostSummary({
    outputs: order.outputs,
    materials: order.materials,
    costEntries: order.costEntries,
    overheadRate: order.overheadRate,
    producedQty: order.producedQty,
  });

  const overheadEntries = order.costEntries.filter((e) => e.type === 'OVERHEAD');
  const wedgeEntries = order.costEntries.filter((e) => e.type === 'WEDGE');
  const labourEntries = order.costEntries.filter((e) => e.type === 'LABOUR');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${order.number}`}
        description={`${order.product.name} — ${order.product.sku}`}
      >
        <Button variant="outline" asChild>
          <Link href="/factory">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          {/* PRO Cost Summary */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                PRO Cost Summary
              </h3>
              <Pill tone={STATUS_TONE[order.status]}>
                {order.status.replace('_', ' ').toLowerCase()}
              </Pill>
            </div>
            <div className="space-y-2">
              <CostRow label="Material cost" value={costSummary.materialCost} />
              <CostRow label="Labour cost" value={costSummary.labourCost} />
              <CostRow label="Fixed overhead" value={costSummary.fixedOverheadCost} />
              <CostRow
                label={`% Overhead on materials (${order.overheadRate?.toFixed(2) ?? '0.00'}%)`}
                value={costSummary.percentOverheadCost}
              />
              <CostRow label="Wedge / sundry" value={costSummary.wedgeCost} />
              <div className="border-t pt-3 mt-3 flex justify-between font-semibold text-sm">
                <span>Total production cost</span>
                <span className="tabular-nums">{costSummary.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Cost per unit ({order.unit})</span>
                <span className="tabular-nums">
                  {costSummary.costPerUnit ? costSummary.costPerUnit.toFixed(4) : '—'}
                </span>
              </div>
            </div>
          </Card>

          {/* Order info */}
          <Card className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Status</div>
                <Pill tone={STATUS_TONE[order.status]}>
                  {order.status.replace('_', ' ').toLowerCase()}
                </Pill>
              </div>
              <div>
                <div className="text-muted-foreground">Planned</div>
                <div className="tabular-nums font-medium">
                  {order.plannedQty.toString()} {order.unit}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Produced</div>
                <div className="tabular-nums font-medium">
                  {order.producedQty.toString()} {order.unit}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Branch</div>
                <div>{order.branch.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Planned start</div>
                <div className="tabular-nums">
                  {order.plannedStartDate.toISOString().slice(0, 10)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Planned end</div>
                <div className="tabular-nums">
                  {order.plannedEndDate.toISOString().slice(0, 10)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Actual start</div>
                <div className="tabular-nums">
                  {order.actualStartDate?.toISOString().slice(0, 10) ?? '—'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Actual end</div>
                <div className="tabular-nums">
                  {order.actualEndDate?.toISOString().slice(0, 10) ?? '—'}
                </div>
              </div>
            </div>
            {order.notes && (
              <p className="mt-4 text-sm text-muted-foreground border-t pt-4">{order.notes}</p>
            )}
          </Card>

          {/* Stages */}
          <Card className="p-0">
            <div className="px-4 py-3 border-b text-sm font-medium">Stages</div>
            <DataTable
              rows={order.stages}
              rowKey={(r) => r.id}
              empty="No stages defined."
              columns={[
                { key: 'seq', header: '#', cell: (r) => r.sequence },
                { key: 'name', header: 'Stage', cell: (r) => r.name },
                {
                  key: 'status',
                  header: 'Status',
                  cell: (r) => (
                    <Pill tone={STAGE_TONE[r.status] ?? 'grey'}>
                      {r.status.replace('_', ' ').toLowerCase()}
                    </Pill>
                  ),
                },
                {
                  key: 'started',
                  header: 'Started',
                  cell: (r) => r.startedAt?.toISOString().slice(0, 10) ?? '—',
                },
                {
                  key: 'completed',
                  header: 'Completed',
                  cell: (r) => r.completedAt?.toISOString().slice(0, 10) ?? '—',
                },
              ]}
            />
          </Card>

          {/* Materials (BOM) */}
          <Card className="p-0">
            <div className="px-4 py-3 border-b text-sm font-medium">Materials (BOM)</div>
            <DataTable
              rows={order.materials}
              rowKey={(r) => r.id}
              empty="No materials on this order."
              columns={[
                { key: 'product', header: 'Product', cell: (r) => r.product.name },
                { key: 'sku', header: 'SKU', cell: (r) => <span className="tabular-nums">{r.product.sku}</span> },
                {
                  key: 'planned',
                  header: 'Planned',
                  align: 'right',
                  cell: (r) => (
                    <span className="tabular-nums">
                      {r.plannedQty.toString()} {r.unit}
                    </span>
                  ),
                },
                {
                  key: 'consumed',
                  header: 'Consumed',
                  align: 'right',
                  cell: (r) => (
                    <span className="tabular-nums">
                      {r.consumedQty.toString()} {r.unit}
                    </span>
                  ),
                },
                {
                  key: 'wh',
                  header: 'Source WH',
                  cell: (r) => r.fromWarehouse?.name ?? '—',
                },
              ]}
            />
          </Card>

          {/* Finished outputs */}
          <Card className="p-0">
            <div className="px-4 py-3 border-b text-sm font-medium">Finished outputs</div>
            <DataTable
              rows={order.outputs}
              rowKey={(r) => r.id}
              empty="No output recorded yet."
              columns={[
                {
                  key: 'date',
                  header: 'Date',
                  cell: (r) => r.createdAt.toISOString().slice(0, 10),
                },
                {
                  key: 'qty',
                  header: 'Qty',
                  align: 'right',
                  cell: (r) => (
                    <span className="tabular-nums">
                      {r.quantity.toString()} {r.unit}
                    </span>
                  ),
                },
                {
                  key: 'cost',
                  header: 'Cost/unit',
                  align: 'right',
                  cell: (r) => <span className="tabular-nums">{r.costPerUnit.toString()}</span>,
                },
                { key: 'wh', header: 'To WH', cell: (r) => r.toWarehouse.name },
                { key: 'note', header: 'Note', cell: (r) => r.note ?? '—' },
              ]}
            />
          </Card>

          {/* Fixed Overhead Entries */}
          <Card className="p-0">
            <div className="px-4 py-3 border-b text-sm font-medium">Fixed Overhead Entries</div>
            <DataTable
              rows={overheadEntries}
              rowKey={(r) => r.id}
              empty="No overhead entries yet."
              columns={[
                { key: 'desc', header: 'Description', cell: (r) => r.description },
                {
                  key: 'amount',
                  header: 'Amount',
                  align: 'right',
                  cell: (r) => <span className="tabular-nums">{r.amount.toFixed(2)}</span>,
                },
                { key: 'note', header: 'Note', cell: (r) => r.note ?? '—' },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  cell: (r) => <DeleteCostEntryButton entryId={r.id} orderId={order.id} />,
                },
              ]}
            />
          </Card>

          {/* Wedge / Sundry Entries */}
          <Card className="p-0">
            <div className="px-4 py-3 border-b text-sm font-medium">Wedge / Sundry Entries</div>
            <DataTable
              rows={wedgeEntries}
              rowKey={(r) => r.id}
              empty="No wedge entries yet."
              columns={[
                { key: 'desc', header: 'Description', cell: (r) => r.description },
                {
                  key: 'amount',
                  header: 'Amount',
                  align: 'right',
                  cell: (r) => <span className="tabular-nums">{r.amount.toFixed(2)}</span>,
                },
                { key: 'note', header: 'Note', cell: (r) => r.note ?? '—' },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  cell: (r) => <DeleteCostEntryButton entryId={r.id} orderId={order.id} />,
                },
              ]}
            />
          </Card>

          {/* Labour Entries */}
          <Card className="p-0">
            <div className="px-4 py-3 border-b text-sm font-medium">Labour Entries</div>
            <DataTable
              rows={labourEntries}
              rowKey={(r) => r.id}
              empty="No labour entries yet."
              columns={[
                { key: 'desc', header: 'Task / Worker', cell: (r) => r.description },
                {
                  key: 'hours',
                  header: 'Hours',
                  align: 'right',
                  cell: (r) => <span className="tabular-nums">{r.hours?.toString() ?? '—'}</span>,
                },
                {
                  key: 'rate',
                  header: 'Rate / hr',
                  align: 'right',
                  cell: (r) => <span className="tabular-nums">{r.rate?.toFixed(2) ?? '—'}</span>,
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  align: 'right',
                  cell: (r) => <span className="tabular-nums">{r.amount.toFixed(2)}</span>,
                },
                { key: 'note', header: 'Note', cell: (r) => r.note ?? '—' },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  cell: (r) => <DeleteCostEntryButton entryId={r.id} orderId={order.id} />,
                },
              ]}
            />
          </Card>
        </div>

        <ProductionControls
          order={{
            id: order.id,
            status: order.status,
            overheadRate: order.overheadRate?.toString() ?? '',
            materials: order.materials.map((m) => ({
              id: m.id,
              productName: m.product.name,
              unit: m.unit,
              plannedQty: m.plannedQty.toString(),
              consumedQty: m.consumedQty.toString(),
              fromWarehouseId: m.fromWarehouseId,
            })),
          }}
          warehouses={warehouses}
        />
      </div>
    </div>
  );
}
