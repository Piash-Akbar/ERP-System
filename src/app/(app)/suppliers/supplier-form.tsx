'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  createSupplierAction,
  updateSupplierAction,
  type SupplierFormState,
} from '@/server/actions/suppliers';

const PAYMENT_TERMS = [
  ['COD', 'Cash on delivery'],
  ['NET_15', 'Net 15'],
  ['NET_30', 'Net 30'],
  ['NET_45', 'Net 45'],
  ['NET_60', 'Net 60'],
  ['NET_90', 'Net 90'],
] as const;

const CURRENCIES = [
  ['BDT', '৳ BDT'],
  ['INR', '₹ INR'],
  ['USD', '$ USD'],
  ['EUR', '€ EUR'],
] as const;

const STATUS = [
  ['ACTIVE', 'Active'],
  ['INACTIVE', 'Inactive'],
  ['BLOCKED', 'Blocked'],
] as const;

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

export interface SupplierFormProps {
  mode: 'create' | 'edit';
  branches: { id: string; name: string; code: string }[];
  initial?: {
    id: string;
    branchId: string;
    name: string;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    taxId: string | null;
    paymentTerms: string;
    currency: string;
    openingBalance: string;
    status: string;
    notes: string | null;
  };
}

export function SupplierForm({ mode, branches, initial }: SupplierFormProps) {
  const action = mode === 'create' ? createSupplierAction : updateSupplierAction;
  const [state, formAction, pending] = useActionState<SupplierFormState, FormData>(action, undefined);
  const E = (f: string) => state?.fieldErrors?.[f]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      {mode === 'edit' && <input type="hidden" name="id" value={initial?.id} />}

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">
              Supplier name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" name="name" required defaultValue={initial?.name} />
            {E('name') && <p className="text-xs text-destructive">{E('name')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="branchId">
              Branch <span className="text-destructive">*</span>
            </Label>
            <select
              id="branchId"
              name="branchId"
              required
              defaultValue={initial?.branchId ?? ''}
              className={selectClass}
            >
              <option value="">— select branch —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
            {E('branchId') && <p className="text-xs text-destructive">{E('branchId')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={initial?.status ?? 'ACTIVE'}
              className={selectClass}
            >
              {STATUS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact person</Label>
            <Input
              id="contactPerson"
              name="contactPerson"
              defaultValue={initial?.contactPerson ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={initial?.phone ?? ''} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initial?.email ?? ''}
            />
            {E('email') && <p className="text-xs text-destructive">{E('email')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">Tax / VAT ID</Label>
            <Input id="taxId" name="taxId" defaultValue={initial?.taxId ?? ''} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              rows={2}
              defaultValue={initial?.address ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={initial?.city ?? ''} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" defaultValue={initial?.country ?? ''} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment terms</Label>
            <select
              id="paymentTerms"
              name="paymentTerms"
              defaultValue={initial?.paymentTerms ?? 'NET_30'}
              className={selectClass}
            >
              {PAYMENT_TERMS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              name="currency"
              defaultValue={initial?.currency ?? 'BDT'}
              className={selectClass}
            >
              {CURRENCIES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="openingBalance">Opening balance (due)</Label>
              <Input
                id="openingBalance"
                name="openingBalance"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
              />
              <p className="text-xs text-muted-foreground">
                Existing payable owed to this supplier as of onboarding. 0 if none.
              </p>
            </div>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={initial?.notes ?? ''}
            />
          </div>
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="dark" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create supplier' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/suppliers">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
