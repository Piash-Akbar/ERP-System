'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { createTradeOrderSchema } from '@/server/validators/trade';
import { createTradeOrder } from '@/server/actions/trade';

type FormValues = z.infer<typeof createTradeOrderSchema>;

interface Props {
  defaultBranchId: string;
  branches: { id: string; name: string; code: string }[];
  customers: { id: string; name: string; code: string }[];
  suppliers: { id: string; name: string; code: string }[];
}

const CURRENCIES = ['USD', 'EUR', 'BDT', 'INR'] as const;
const INCOTERMS = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP', 'CPT', 'CIP', 'FAS'];

export function NewTradeOrderForm({ defaultBranchId, branches, customers, suppliers }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(createTradeOrderSchema),
    defaultValues: {
      branchId: defaultBranchId,
      type: 'EXPORT',
      currency: 'USD',
      exchangeRate: 1,
      items: [{ description: '', quantity: 1, unitPrice: 0, unit: 'PCS' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const orderType = form.watch('type');

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await createTradeOrder(values);
      if (res.success) {
        toast.success('Trade order created');
        router.push(`/trade/orders/${res.data.id}`);
      } else {
        toast.error(res.error ?? 'Failed to create order');
      }
    });
  }

  const totalValue = form.watch('items').reduce((sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0), 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Order Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="branchId" render={({ field }) => (
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Order Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="EXPORT">Export</SelectItem>
                    <SelectItem value="IMPORT">Import</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {orderType === 'EXPORT' ? (
              <FormField control={form.control} name="customerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer (Buyer)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            ) : (
              <FormField control={form.control} name="supplierId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier (Seller)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="contractRef" render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Reference</FormLabel>
                <FormControl><Input placeholder="CONTRACT-001" {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="currency" render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <FormField control={form.control} name="exchangeRate" render={({ field }) => (
              <FormItem>
                <FormLabel>Exchange Rate (to BDT)</FormLabel>
                <FormControl><Input type="number" step="0.000001" {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="incoterms" render={({ field }) => (
              <FormItem>
                <FormLabel>Incoterms</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select incoterms" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {INCOTERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <FormField control={form.control} name="portOfLoading" render={({ field }) => (
              <FormItem>
                <FormLabel>Port of Loading</FormLabel>
                <FormControl><Input placeholder="Chittagong" {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="portOfDischarge" render={({ field }) => (
              <FormItem>
                <FormLabel>Port of Discharge</FormLabel>
                <FormControl><Input placeholder="Hamburg" {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="latestShipDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Latest Shipment Date</FormLabel>
                <FormControl>
                  <Input type="date" value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} />
                </FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="expectedArrival" render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Arrival</FormLabel>
                <FormControl>
                  <Input type="date" value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} />
                </FormControl>
              </FormItem>
            )} />

            <div className="md:col-span-2">
              <FormField control={form.control} name="goodsDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>Goods Description</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="Leather goods, shoes, etc." {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            <div className="md:col-span-2">
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Line Items</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => append({ description: '', quantity: 1, unitPrice: 0, unit: 'PCS' })}>
              <Plus className="mr-1 h-3 w-3" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <FormField control={form.control} name={`items.${idx}.description`} render={({ field }) => (
                    <FormItem>
                      {idx === 0 && <FormLabel>Description</FormLabel>}
                      <FormControl><Input placeholder="Leather bag" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="col-span-2">
                  <FormField control={form.control} name={`items.${idx}.hsCode`} render={({ field }) => (
                    <FormItem>
                      {idx === 0 && <FormLabel>HS Code</FormLabel>}
                      <FormControl><Input placeholder="4202.11" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <div className="col-span-2">
                  <FormField control={form.control} name={`items.${idx}.quantity`} render={({ field }) => (
                    <FormItem>
                      {idx === 0 && <FormLabel>Qty</FormLabel>}
                      <FormControl><Input type="number" step="0.001" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="col-span-2">
                  <FormField control={form.control} name={`items.${idx}.unitPrice`} render={({ field }) => (
                    <FormItem>
                      {idx === 0 && <FormLabel>Unit Price</FormLabel>}
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="col-span-1">
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {idx === 0 && <div className="mb-2 invisible">Total</div>}
                    {((form.watch(`items.${idx}.quantity`) || 0) * (form.watch(`items.${idx}.unitPrice`) || 0)).toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1">
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <p className="text-sm font-semibold tabular-nums">
                Total: {totalValue.toFixed(2)} {form.watch('currency')}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={pending}>Create Order</Button>
        </div>
      </form>
    </Form>
  );
}
