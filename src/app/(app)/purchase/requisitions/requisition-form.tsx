'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  createRequisitionAction,
  type PurchaseFormState,
} from '@/server/actions/purchase';

const UNITS = ['PCS', 'KG', 'G', 'M', 'M2', 'L', 'ML', 'BOX', 'PACK', 'PAIR', 'SET'] as const;
const PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

interface Row {
  key: string;
  productName: string;
  unit: (typeof UNITS)[number];
  quantity: string;
  estimatedPrice: string;
  note: string;
}

function newRow(): Row {
  return {
    key: `r-${Math.random().toString(36).slice(2, 8)}`,
    productName: '',
    unit: 'PCS',
    quantity: '',
    estimatedPrice: '',
    note: '',
  };
}

export function RequisitionForm({
  branches,
}: {
  branches: { id: string; name: string; code: string }[];
}) {
  const [state, formAction, pending] = useActionState<PurchaseFormState, FormData>(
    createRequisitionAction,
    undefined,
  );
  const [rows, setRows] = useState<Row[]>([newRow()]);

  const E = (f: string) => state?.fieldErrors?.[f]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="itemsJson"
        value={JSON.stringify(
          rows
            .filter((r) => r.productName && r.quantity)
            .map((r) => ({
              productName: r.productName,
              unit: r.unit,
              quantity: r.quantity,
              estimatedPrice: r.estimatedPrice || 0,
              note: r.note,
            })),
        )}
      />

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="branchId">
              Branch <span className="text-destructive">*</span>
            </Label>
            <select
              id="branchId"
              name="branchId"
              required
              defaultValue={branches[0]?.id ?? ''}
              className={selectClass}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">
              Department <span className="text-destructive">*</span>
            </Label>
            <Input id="department" name="department" required />
            {E('department') && <p className="text-xs text-destructive">{E('department')}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="requestedBy">
              Requested by <span className="text-destructive">*</span>
            </Label>
            <Input id="requestedBy" name="requestedBy" required />
            {E('requestedBy') && (
              <p className="text-xs text-destructive">{E('requestedBy')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              name="priority"
              defaultValue="MEDIUM"
              className={selectClass}
            >
              {PRIORITY.map((p) => (
                <option key={p} value={p}>
                  {p.toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="requiredDate">
              Required date <span className="text-destructive">*</span>
            </Label>
            <Input id="requiredDate" name="requiredDate" type="date" required />
            {E('requiredDate') && (
              <p className="text-xs text-destructive">{E('requiredDate')}</p>
            )}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              Items <span className="text-destructive">*</span>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRows((rs) => [...rs, newRow()])}
            >
              <Plus className="h-3 w-3" />
              Add Item
            </Button>
          </div>
          <div className="space-y-3">
            {rows.map((r, idx) => (
              <div
                key={r.key}
                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-end"
              >
                <div>
                  {idx === 0 && <Label className="text-xs">Product name</Label>}
                  <Input
                    value={r.productName}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((x) => (x.key === r.key ? { ...x, productName: e.target.value } : x)),
                      )
                    }
                    placeholder="e.g. Full grain leather"
                  />
                </div>
                <div>
                  {idx === 0 && <Label className="text-xs">Quantity</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={r.quantity}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((x) => (x.key === r.key ? { ...x, quantity: e.target.value } : x)),
                      )
                    }
                  />
                </div>
                <div>
                  {idx === 0 && <Label className="text-xs">Unit</Label>}
                  <select
                    value={r.unit}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((x) =>
                          x.key === r.key ? { ...x, unit: e.target.value as Row['unit'] } : x,
                        ),
                      )
                    }
                    className={selectClass}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  {idx === 0 && <Label className="text-xs">Est. price</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={r.estimatedPrice}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((x) =>
                          x.key === r.key ? { ...x, estimatedPrice: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={rows.length === 1}
                    onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {E('items') && <p className="text-xs text-destructive">{E('items')}</p>}
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="dark" disabled={pending}>
          {pending ? 'Creating…' : 'Create Requisition'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/purchase/requisitions">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
