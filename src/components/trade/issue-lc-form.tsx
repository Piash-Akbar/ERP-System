'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { createLCSchema } from '@/server/validators/trade';
import { createLetterOfCredit } from '@/server/actions/trade';

type FormValues = z.infer<typeof createLCSchema>;

interface Order {
  id: string;
  number: string;
  type: string;
  currency: string;
  totalValue: number;
  portOfLoading: string | null;
  portOfDischarge: string | null;
  goodsDescription: string | null;
  latestShipDate: Date | null;
  customer: { name: string } | null;
  supplier: { name: string } | null;
}

interface Props {
  orders: Order[];
  branches: { id: string; name: string }[];
  defaultBranchId: string;
  preselectedOrderId?: string;
}

const LC_TYPES = ['SIGHT', 'USANCE', 'RED_CLAUSE', 'REVOLVING', 'STANDBY', 'TRANSFERABLE'] as const;
const PAYMENT_MODES = ['AT_SIGHT', 'USANCE_30', 'USANCE_60', 'USANCE_90', 'USANCE_120', 'USANCE_180', 'DEFERRED'] as const;
const CURRENCIES = ['USD', 'EUR', 'BDT', 'INR'] as const;

export function IssueLCForm({ orders, branches, defaultBranchId, preselectedOrderId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(createLCSchema),
    defaultValues: {
      branchId: defaultBranchId,
      tradeOrderId: preselectedOrderId ?? '',
      type: 'SIGHT',
      paymentMode: 'AT_SIGHT',
      currency: 'USD',
      lcAmount: 0,
      tolerancePlus: 0,
      toleranceMinus: 0,
      presentationDays: 21,
      partialShipment: false,
      transhipmentAllowed: false,
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 90 * 86400000),
      applicantName: '',
      beneficiaryName: '',
      issuingBank: '',
      issuingBankSwift: '',
      advisingBank: '',
      advisingBankSwift: '',
      confirmingBank: '',
      portOfLoading: '',
      portOfDischarge: '',
      goodsDescription: '',
      specialConditions: '',
      expiryPlace: '',
      latestShipDate: undefined,
      swiftMt700Ref: '',
    },
  });

  const selectedOrderId = form.watch('tradeOrderId');
  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  // Auto-fill from order
  useEffect(() => {
    if (!selectedOrder) return;
    const counterparty = selectedOrder.customer?.name ?? selectedOrder.supplier?.name ?? '';
    form.setValue('currency', selectedOrder.currency as 'USD' | 'EUR' | 'BDT' | 'INR');
    form.setValue('lcAmount', selectedOrder.totalValue);
    if (selectedOrder.portOfLoading) form.setValue('portOfLoading', selectedOrder.portOfLoading);
    if (selectedOrder.portOfDischarge) form.setValue('portOfDischarge', selectedOrder.portOfDischarge);
    if (selectedOrder.goodsDescription) form.setValue('goodsDescription', selectedOrder.goodsDescription);
    if (selectedOrder.latestShipDate) form.setValue('latestShipDate', new Date(selectedOrder.latestShipDate));
    if (selectedOrder.type === 'EXPORT') form.setValue('beneficiaryName', counterparty);
    else form.setValue('applicantName', counterparty);
  }, [selectedOrderId]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await createLetterOfCredit(values);
      if (res.success) {
        toast.success('Letter of Credit issued');
        router.push(`/trade/lc/${res.data.id}`);
      } else {
        toast.error(res.error ?? 'Failed');
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Trade Order & Branch */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Linked Trade Order</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="tradeOrderId" render={({ field }) => (
              <FormItem>
                <FormLabel>Trade Order *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.number} — {o.type} ({o.customer?.name ?? o.supplier?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="branchId" render={({ field }) => (
              <FormItem>
                <FormLabel>Branch *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* LC Type & Parties */}
        <Card>
          <CardHeader><CardTitle className="text-sm">LC Type & Parties</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>LC Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {LC_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <FormField control={form.control} name="paymentMode" render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Mode *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <FormField control={form.control} name="applicantName" render={({ field }) => (
              <FormItem>
                <FormLabel>Applicant (Importer) *</FormLabel>
                <FormControl><Input placeholder="Company name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="beneficiaryName" render={({ field }) => (
              <FormItem>
                <FormLabel>Beneficiary (Exporter) *</FormLabel>
                <FormControl><Input placeholder="Company name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="issuingBank" render={({ field }) => (
              <FormItem>
                <FormLabel>Issuing Bank *</FormLabel>
                <FormControl><Input placeholder="Dutch-Bangla Bank Ltd." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="issuingBankSwift" render={({ field }) => (
              <FormItem>
                <FormLabel>Issuing Bank SWIFT</FormLabel>
                <FormControl><Input placeholder="DBBLBDDH" {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="advisingBank" render={({ field }) => (
              <FormItem>
                <FormLabel>Advising Bank</FormLabel>
                <FormControl><Input placeholder="Deutsche Bank AG" {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="advisingBankSwift" render={({ field }) => (
              <FormItem>
                <FormLabel>Advising Bank SWIFT</FormLabel>
                <FormControl><Input placeholder="DEUTDEDB" {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="confirmingBank" render={({ field }) => (
              <FormItem>
                <FormLabel>Confirming Bank</FormLabel>
                <FormControl><Input placeholder="Optional" {...field} /></FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Financial Terms */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Financial Terms</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="currency" render={({ field }) => (
              <FormItem>
                <FormLabel>Currency *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <FormField control={form.control} name="lcAmount" render={({ field }) => (
              <FormItem>
                <FormLabel>LC Amount *</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="tolerancePlus" render={({ field }) => (
              <FormItem>
                <FormLabel>Tolerance + (%)</FormLabel>
                <FormControl><Input type="number" step="0.1" min="0" max="10" {...field} /></FormControl>
                <FormDescription>UCP 600 Art. 30 — typically 5%</FormDescription>
              </FormItem>
            )} />

            <FormField control={form.control} name="toleranceMinus" render={({ field }) => (
              <FormItem>
                <FormLabel>Tolerance - (%)</FormLabel>
                <FormControl><Input type="number" step="0.1" min="0" max="10" {...field} /></FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Dates & Shipment</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="issueDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date *</FormLabel>
                <FormControl>
                  <Input type="date" value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''} onChange={(e) => field.onChange(new Date(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="expiryDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date *</FormLabel>
                <FormControl>
                  <Input type="date" value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''} onChange={(e) => field.onChange(new Date(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="expiryPlace" render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Place</FormLabel>
                <FormControl><Input placeholder="Dhaka, Bangladesh" {...field} /></FormControl>
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

            <FormField control={form.control} name="presentationDays" render={({ field }) => (
              <FormItem>
                <FormLabel>Presentation Period (days)</FormLabel>
                <FormControl><Input type="number" min="1" max="45" {...field} /></FormControl>
                <FormDescription>Days after BL date to present documents (UCP 600: max 21)</FormDescription>
              </FormItem>
            )} />

            <FormField control={form.control} name="portOfLoading" render={({ field }) => (
              <FormItem>
                <FormLabel>Port of Loading</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="portOfDischarge" render={({ field }) => (
              <FormItem>
                <FormLabel>Port of Discharge</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />

            <div className="flex gap-6 items-center">
              <FormField control={form.control} name="partialShipment" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!mt-0">Partial Shipment Allowed</FormLabel>
                </FormItem>
              )} />
              <FormField control={form.control} name="transhipmentAllowed" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!mt-0">Transhipment Allowed</FormLabel>
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* Goods & Conditions */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Goods & Special Conditions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="goodsDescription" render={({ field }) => (
              <FormItem>
                <FormLabel>Goods Description</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="specialConditions" render={({ field }) => (
              <FormItem>
                <FormLabel>Special Conditions</FormLabel>
                <FormControl><Textarea rows={4} placeholder="Third-party documents acceptable. Insurance to be effected by beneficiary..." {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="swiftMt700Ref" render={({ field }) => (
              <FormItem>
                <FormLabel>SWIFT MT700 Reference</FormLabel>
                <FormControl><Input placeholder="Optional — issuing bank's SWIFT ref" {...field} /></FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={pending}>Issue LC</Button>
        </div>
      </form>
    </Form>
  );
}
