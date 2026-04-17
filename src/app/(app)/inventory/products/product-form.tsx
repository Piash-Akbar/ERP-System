'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from '@/server/actions/products';

const PRODUCT_TYPES = [
  ['RAW_MATERIAL', 'Raw material'],
  ['WORK_IN_PROGRESS', 'Work in progress'],
  ['FINISHED_GOOD', 'Finished good'],
  ['CONSUMABLE', 'Consumable'],
  ['SERVICE', 'Service'],
] as const;

const UNITS = ['PCS', 'KG', 'G', 'M', 'M2', 'L', 'ML', 'BOX', 'PACK', 'PAIR', 'SET'] as const;

export interface ProductFormProps {
  mode: 'create' | 'edit';
  initial?: {
    id: string;
    sku: string;
    barcode: string | null;
    name: string;
    description: string | null;
    type: (typeof PRODUCT_TYPES)[number][0];
    unit: (typeof UNITS)[number];
    categoryId: string | null;
    brandId: string | null;
    costPrice: string;
    sellPrice: string;
    taxRate: string;
    reorderLevel: string;
    reorderQty: string;
    isActive: boolean;
    imageUrl: string | null;
  };
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}

export function ProductForm({ mode, initial, categories, brands }: ProductFormProps) {
  const action = mode === 'create' ? createProductAction : updateProductAction;
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(action, undefined);

  const E = (field: string) => state?.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      {mode === 'edit' && <input type="hidden" name="id" value={initial?.id} />}

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sku">
              SKU <span className="text-destructive">*</span>
            </Label>
            <Input id="sku" name="sku" required defaultValue={initial?.sku} placeholder="e.g. LSR-BRN-001" />
            {E('sku') && <p className="text-xs text-destructive">{E('sku')}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input id="barcode" name="barcode" defaultValue={initial?.barcode ?? ''} />
            {E('barcode') && <p className="text-xs text-destructive">{E('barcode')}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" name="name" required defaultValue={initial?.name} />
            {E('name') && <p className="text-xs text-destructive">{E('name')}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={initial?.description ?? ''} />
          </div>
          <SelectField label="Type" name="type" defaultValue={initial?.type ?? 'FINISHED_GOOD'}>
            {PRODUCT_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <SelectField label="Unit" name="unit" defaultValue={initial?.unit ?? 'PCS'}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </SelectField>
          <SelectField label="Category" name="categoryId" defaultValue={initial?.categoryId ?? ''}>
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Brand" name="brandId" defaultValue={initial?.brandId ?? ''}>
            <option value="">— none —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </SelectField>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <MoneyField label="Cost price" name="costPrice" defaultValue={initial?.costPrice ?? '0'} error={E('costPrice')} />
          <MoneyField label="Sell price" name="sellPrice" defaultValue={initial?.sellPrice ?? '0'} error={E('sellPrice')} />
          <MoneyField label="Tax rate (%)" name="taxRate" defaultValue={initial?.taxRate ?? '0'} error={E('taxRate')} />
          <MoneyField label="Reorder level" name="reorderLevel" defaultValue={initial?.reorderLevel ?? '0'} />
          <MoneyField label="Reorder quantity" name="reorderQty" defaultValue={initial?.reorderQty ?? '0'} />
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input id="imageUrl" name="imageUrl" type="url" defaultValue={initial?.imageUrl ?? ''} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initial?.isActive ?? true}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm">Active (available for transactions)</span>
          </label>
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create product' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/inventory/products">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
      >
        {children}
      </select>
    </div>
  );
}

function MoneyField({
  label,
  name,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="text"
        inputMode="decimal"
        defaultValue={defaultValue}
        className="tabular"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
