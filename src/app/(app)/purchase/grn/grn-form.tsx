'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { createGrnAction, type PurchaseFormState } from '@/server/actions/purchase';

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

export interface POLine {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  unit: string;
  orderedQty: string;
  receivedQty: string;
  unitPrice: string;
}

export interface GrnFormProps {
  purchaseOrder: {
    id: string;
    number: string;
    supplierName: string;
    branchId: string;
  };
  warehouses: { id: string; name: string; code: string }[];
  lines: POLine[];
}

interface RowState {
  receivedQty: string;
  rejectedQty: string;
  unitCost: string;
  note: string;
}

export function GrnForm({ purchaseOrder, warehouses, lines }: GrnFormProps) {
  const [state, formAction, pending] = useActionState<PurchaseFormState, FormData>(
    createGrnAction,
    undefined,
  );
  const [rowState, setRowState] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {};
    for (const l of lines) {
      const remaining = (parseFloat(l.orderedQty) - parseFloat(l.receivedQty)).toString();
      init[l.id] = {
        receivedQty: remaining,
        rejectedQty: '0',
        unitCost: l.unitPrice,
        note: '',
      };
    }
    return init;
  });

  const items = lines
    .filter((l) => parseFloat(rowState[l.id]?.receivedQty ?? '0') > 0)
    .map((l) => ({
      purchaseOrderItemId: l.id,
      productId: l.productId,
      receivedQty: rowState[l.id]?.receivedQty ?? '0',
      rejectedQty: rowState[l.id]?.rejectedQty ?? '0',
      unitCost: rowState[l.id]?.unitCost ?? l.unitPrice,
      note: rowState[l.id]?.note ?? '',
    }));

  const E = (f: string) => state?.fieldErrors?.[f]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="purchaseOrderId" value={purchaseOrder.id} />
      <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Purchase order</Label>
            <p className="text-sm font-medium tabular">
              {purchaseOrder.number}
            </p>
            <p className="text-xs text-muted-foreground">{purchaseOrder.supplierName}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="warehouseId">
              Warehouse <span className="text-destructive">*</span>
            </Label>
            <select id="warehouseId" name="warehouseId" required className={selectClass}>
              <option value="">— select warehouse —</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            {E('warehouseId') && <p className="text-xs text-destructive">{E('warehouseId')}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="receivedDate">
              Received date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="receivedDate"
              name="receivedDate"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium">Line items to receive</div>
        <div className="divide-y">
          {lines.map((l) => {
            const remaining = parseFloat(l.orderedQty) - parseFloat(l.receivedQty);
            const st =
              rowState[l.id] ??
              ({ receivedQty: '', rejectedQty: '0', unitCost: l.unitPrice, note: '' } satisfies RowState);
            return (
              <div
                key={l.id}
                className="p-4 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 items-end"
              >
                <div>
                  <p className="font-medium">{l.productName}</p>
                  <p className="text-xs text-muted-foreground tabular">{l.productSku}</p>
                  <p className="text-xs text-muted-foreground">
                    Ordered <span className="tabular">{l.orderedQty}</span> · Received{' '}
                    <span className="tabular">{l.receivedQty}</span> · Remaining{' '}
                    <span className="tabular font-semibold">{remaining}</span> {l.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-xs">Receive qty</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={remaining}
                    value={st.receivedQty}
                    onChange={(e) =>
                      setRowState((s) => ({
                        ...s,
                        [l.id]: { ...s[l.id]!, receivedQty: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Rejected</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={st.rejectedQty}
                    onChange={(e) =>
                      setRowState((s) => ({
                        ...s,
                        [l.id]: { ...s[l.id]!, rejectedQty: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Unit cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={st.unitCost}
                    onChange={(e) =>
                      setRowState((s) => ({
                        ...s,
                        [l.id]: { ...s[l.id]!, unitCost: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Note</Label>
                  <Input
                    value={st.note}
                    onChange={(e) =>
                      setRowState((s) => ({
                        ...s,
                        [l.id]: { ...s[l.id]!, note: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="dark" disabled={pending || items.length === 0}>
          {pending ? 'Posting…' : `Post GRN (${items.length} lines)`}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/purchase/orders/${purchaseOrder.id}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
