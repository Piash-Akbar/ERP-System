'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill, type PillTone } from '@/components/shared/pill';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { createLCDrawdown, decideLCDrawdown, recordLCDrawdownPayment } from '@/server/actions/trade';
import { formatCurrency, type CurrencyCode } from '@/lib/money';
import { createLCDrawdownSchema } from '@/server/validators/trade';

const DRAWDOWN_TONE: Record<string, PillTone> = {
  DRAFT: 'grey',
  DOCUMENTS_SUBMITTED: 'blue',
  DOCUMENTS_ACCEPTED: 'green',
  PAYMENT_RECEIVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'grey',
};

interface Drawdown {
  id: string;
  drawdownNumber: number;
  status: string;
  presentationDate: Date;
  documentsDueBy: Date | null;
  amount: { toString(): string };
  commercialInvoiceRef: string | null;
  blRef: string | null;
  packingListRef: string | null;
  certificateOfOrigin: boolean;
  inspectionCert: boolean;
  paymentDueDate: Date | null;
  paymentReceivedAt: Date | null;
  bankCharges: { toString(): string };
  notes: string | null;
  discrepancyNote: string | null;
}

interface Props {
  lcId: string;
  drawdowns: Drawdown[];
  lcStatus: string;
  currency: CurrencyCode;
  availableAmount: string;
}

const schema = createLCDrawdownSchema;
type FormValues = z.infer<typeof schema>;

const ACTIVE_LC_STATUSES = ['ISSUED', 'ADVISED', 'CONFIRMED', 'ACTIVE', 'PARTIALLY_UTILIZED'];

export function LCDrawdownList({ lcId, drawdowns, lcStatus, currency, availableAmount }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      lcId,
      presentationDate: new Date(),
      amount: 0,
      certificateOfOrigin: false,
      inspectionCert: false,
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await createLCDrawdown(values);
      if (res.success) {
        toast.success('Drawdown presentation recorded');
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function submitDrawdown(id: string) {
    startTransition(async () => {
      const res = await decideLCDrawdown({ drawdownId: id, decision: 'DOCUMENTS_ACCEPTED' });
      if (res.success) { toast.success('Documents accepted'); router.refresh(); }
      else toast.error(res.error);
    });
  }

  function rejectDrawdown(id: string) {
    startTransition(async () => {
      const res = await decideLCDrawdown({ drawdownId: id, decision: 'REJECTED', discrepancyNote: 'Rejected by bank' });
      if (res.success) { toast.success('Drawdown rejected'); router.refresh(); }
      else toast.error(res.error);
    });
  }

  function recordPayment(id: string) {
    startTransition(async () => {
      const res = await recordLCDrawdownPayment({ drawdownId: id, paymentReceivedAt: new Date(), bankCharges: 0 });
      if (res.success) { toast.success('Payment recorded'); router.refresh(); }
      else toast.error(res.error);
    });
  }

  const canDraw = ACTIVE_LC_STATUSES.includes(lcStatus);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">LC Drawdowns / Presentations</CardTitle>
        {canDraw && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-3 w-3" />
            New Drawdown
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {drawdowns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No drawdowns yet.</p>
        ) : (
          <div className="divide-y">
            {drawdowns.map((dd) => (
              <div key={dd.id} className="py-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Drawdown #{dd.drawdownNumber}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm tabular-nums">
                      {formatCurrency(dd.amount.toString(), currency)}
                    </span>
                    <Pill tone={DRAWDOWN_TONE[dd.status] ?? 'grey'}>
                      {dd.status.replace(/_/g, ' ')}
                    </Pill>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                  <span>Presented: {new Date(dd.presentationDate).toLocaleDateString()}</span>
                  {dd.documentsDueBy && <span>Docs due: {new Date(dd.documentsDueBy).toLocaleDateString()}</span>}
                  {dd.blRef && <span>BL: {dd.blRef}</span>}
                  {dd.commercialInvoiceRef && <span>Invoice: {dd.commercialInvoiceRef}</span>}
                </div>
                {dd.discrepancyNote && (
                  <p className="text-xs text-red-600 mt-1">{dd.discrepancyNote}</p>
                )}
                {dd.status === 'DOCUMENTS_SUBMITTED' && (
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => submitDrawdown(dd.id)} disabled={pending}>
                      Accept Docs
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => rejectDrawdown(dd.id)} disabled={pending}>
                      Reject
                    </Button>
                  </div>
                )}
                {dd.status === 'DOCUMENTS_ACCEPTED' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs mt-1 w-fit" onClick={() => recordPayment(dd.id)} disabled={pending}>
                    Mark Payment Received
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New LC Drawdown Presentation</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Available: <span className="font-medium">{formatCurrency(availableAmount, currency)}</span>
              </p>

              <FormField control={form.control} name="presentationDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Presentation Date</FormLabel>
                  <FormControl>
                    <Input type="date" value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''} onChange={(e) => field.onChange(new Date(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Draw Amount ({currency})</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="commercialInvoiceRef" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commercial Invoice Ref</FormLabel>
                    <FormControl><Input placeholder="INV-001" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="blRef" render={({ field }) => (
                  <FormItem>
                    <FormLabel>BL Number</FormLabel>
                    <FormControl><Input placeholder="BL-001" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="packingListRef" render={({ field }) => (
                <FormItem>
                  <FormLabel>Packing List Ref</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />

              <div className="flex gap-6">
                <FormField control={form.control} name="certificateOfOrigin" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="!mt-0">Certificate of Origin</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="inspectionCert" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="!mt-0">Inspection Certificate</FormLabel>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={pending}>Submit Drawdown</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
