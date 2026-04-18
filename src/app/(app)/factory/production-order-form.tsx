'use client';

import { useActionState, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createProductionOrderAction, type FactoryFormState } from '@/server/actions/factory';
import { UNITS } from '@/server/validators/factory';

type Branch = { id: string; name: string; code: string };
type Product = { id: string; sku: string; name: string; unit: string; type: string };
type Warehouse = { id: string; code: string; name: string; branchId: string };

interface MaterialRow {
  productId: string;
  unit: (typeof UNITS)[number];
  plannedQty: string;
  fromWarehouseId: string;
  note: string;
}

interface StageRow {
  sequence: number;
  name: string;
  notes: string;
}

export function ProductionOrderForm({
  branches,
  products,
  warehouses,
}: {
  branches: Branch[];
  products: Product[];
  warehouses: Warehouse[];
}) {
  const [state, action, pending] = useActionState<FactoryFormState, FormData>(
    createProductionOrderAction,
    undefined,
  );
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [stages, setStages] = useState<StageRow[]>([
    { sequence: 1, name: 'Cutting', notes: '' },
    { sequence: 2, name: 'Stitching', notes: '' },
    { sequence: 3, name: 'Finishing', notes: '' },
  ]);

  const branchWarehouses = useMemo(
    () => warehouses.filter((w) => w.branchId === branchId),
    [warehouses, branchId],
  );

  const materialProducts = useMemo(
    () => products.filter((p) => p.type === 'RAW_MATERIAL' || p.type === 'CONSUMABLE'),
    [products],
  );

  const finishedProducts = useMemo(
    () =>
      products.filter((p) => p.type === 'FINISHED_GOOD' || p.type === 'WORK_IN_PROGRESS'),
    [products],
  );

  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="materials" value={JSON.stringify(materials)} />
      <input type="hidden" name="stages" value={JSON.stringify(stages)} />

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Order details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="branchId">Branch *</Label>
            <select
              id="branchId"
              name="branchId"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="productId">Finished product *</Label>
            <select
              id="productId"
              name="productId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              {finishedProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.sku}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="plannedQty">Planned quantity *</Label>
            <Input id="plannedQty" name="plannedQty" type="number" min="0.0001" step="0.0001" required />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <select
              id="unit"
              name="unit"
              defaultValue="PCS"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="plannedStartDate">Planned start *</Label>
            <Input id="plannedStartDate" name="plannedStartDate" type="date" required />
          </div>
          <div>
            <Label htmlFor="plannedEndDate">Planned end *</Label>
            <Input id="plannedEndDate" name="plannedEndDate" type="date" required />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Materials (BOM)</h2>
            <p className="text-sm text-muted-foreground">Raw materials consumed per run</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setMaterials((prev) => [
                ...prev,
                {
                  productId: materialProducts[0]?.id ?? '',
                  unit: 'PCS',
                  plannedQty: '1',
                  fromWarehouseId: branchWarehouses[0]?.id ?? '',
                  note: '',
                },
              ])
            }
          >
            <Plus className="h-4 w-4" /> Add material
          </Button>
        </div>

        {materials.length === 0 ? (
          <p className="text-sm text-muted-foreground">No materials added yet.</p>
        ) : (
          <div className="space-y-3">
            {materials.map((m, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-[2fr_100px_120px_2fr_auto] gap-2 items-end"
              >
                <select
                  value={m.productId}
                  onChange={(e) =>
                    setMaterials((prev) =>
                      prev.map((r, idx) => (idx === i ? { ...r, productId: e.target.value } : r)),
                    )
                  }
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {materialProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.sku}
                    </option>
                  ))}
                </select>
                <select
                  value={m.unit}
                  onChange={(e) =>
                    setMaterials((prev) =>
                      prev.map((r, idx) =>
                        idx === i ? { ...r, unit: e.target.value as (typeof UNITS)[number] } : r,
                      ),
                    )
                  }
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={m.plannedQty}
                  onChange={(e) =>
                    setMaterials((prev) =>
                      prev.map((r, idx) => (idx === i ? { ...r, plannedQty: e.target.value } : r)),
                    )
                  }
                />
                <select
                  value={m.fromWarehouseId}
                  onChange={(e) =>
                    setMaterials((prev) =>
                      prev.map((r, idx) =>
                        idx === i ? { ...r, fromWarehouseId: e.target.value } : r,
                      ),
                    )
                  }
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">— source warehouse —</option>
                  {branchWarehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setMaterials((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Stages</h2>
            <p className="text-sm text-muted-foreground">Production workflow sequence</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setStages((prev) => [
                ...prev,
                { sequence: prev.length + 1, name: '', notes: '' },
              ])
            }
          >
            <Plus className="h-4 w-4" /> Add stage
          </Button>
        </div>

        <div className="space-y-2">
          {stages.map((s, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-[80px_2fr_3fr_auto] gap-2 items-center"
            >
              <Input
                type="number"
                min="1"
                value={s.sequence}
                onChange={(e) =>
                  setStages((prev) =>
                    prev.map((r, idx) =>
                      idx === i ? { ...r, sequence: Number(e.target.value) } : r,
                    ),
                  )
                }
              />
              <Input
                placeholder="Stage name"
                value={s.name}
                onChange={(e) =>
                  setStages((prev) =>
                    prev.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)),
                  )
                }
              />
              <Input
                placeholder="Notes (optional)"
                value={s.notes}
                onChange={(e) =>
                  setStages((prev) =>
                    prev.map((r, idx) => (idx === i ? { ...r, notes: e.target.value } : r)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStages((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {state?.error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {Object.entries(fieldErrors).map(([k, v]) => (
        <p key={k} className="text-xs text-red-600">
          {k}: {v?.join(', ')}
        </p>
      ))}

      <div className="flex justify-end gap-2">
        <Button type="submit" variant="dark" disabled={pending}>
          {pending ? 'Creating…' : 'Create production order'}
        </Button>
      </div>
    </form>
  );
}
