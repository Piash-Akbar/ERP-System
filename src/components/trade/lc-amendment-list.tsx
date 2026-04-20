'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
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
import { createLCAmendment, decideLCAmendment } from '@/server/actions/trade';
import { createLCAmendmentSchema } from '@/server/validators/trade';

const AMEND_STATUS_TONE: Record<string, PillTone> = {
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'grey',
};

interface Amendment {
  id: string;
  amendmentNumber: number;
  status: string;
  reason: string;
  newExpiryDate: Date | null;
  newLcAmount: { toString(): string } | null;
  newLatestShipDate: Date | null;
  newSpecialConditions: string | null;
  createdAt: Date;
}

interface Props {
  lcId: string;
  amendments: Amendment[];
  lcStatus: string;
}

const schema = createLCAmendmentSchema;
type FormValues = z.infer<typeof schema>;

const AMENDABLE = ['ISSUED', 'ADVISED', 'CONFIRMED', 'ACTIVE'];

export function LCAmendmentList({ lcId, amendments, lcStatus }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { lcId, reason: '' },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await createLCAmendment(values);
      if (res.success) {
        toast.success('Amendment submitted');
        setOpen(false);
        form.reset({ lcId, reason: '' });
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function decide(id: string, decision: 'APPROVED' | 'REJECTED') {
    startTransition(async () => {
      const res = await decideLCAmendment({ amendmentId: id, decision });
      if (res.success) { toast.success(`Amendment ${decision.toLowerCase()}`); router.refresh(); }
      else toast.error(res.error);
    });
  }

  const canAmend = AMENDABLE.includes(lcStatus);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">LC Amendments</CardTitle>
        {canAmend && (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-3 w-3" />
            Request Amendment
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {amendments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No amendments.</p>
        ) : (
          <div className="divide-y">
            {amendments.map((a) => (
              <div key={a.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Amendment #{a.amendmentNumber}</span>
                  <Pill tone={AMEND_STATUS_TONE[a.status] ?? 'grey'}>{a.status}</Pill>
                </div>
                <p className="text-xs text-muted-foreground">{a.reason}</p>
                <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                  {a.newExpiryDate && <span>New Expiry: {new Date(a.newExpiryDate).toLocaleDateString()}</span>}
                  {a.newLcAmount && <span>New Amount: {a.newLcAmount.toString()}</span>}
                  {a.newLatestShipDate && <span>New Ship Date: {new Date(a.newLatestShipDate).toLocaleDateString()}</span>}
                </div>
                {a.status === 'PENDING' && (
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" className="h-7 text-xs" onClick={() => decide(a.id, 'APPROVED')} disabled={pending}>
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => decide(a.id, 'REJECTED')} disabled={pending}>
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request LC Amendment (MT 707)</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-xs text-muted-foreground">Leave blank any fields that should remain unchanged.</p>

              <FormField control={form.control} name="newExpiryDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="newLcAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel>New LC Amount</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="Leave blank to keep current" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="newLatestShipDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Latest Shipment Date</FormLabel>
                  <FormControl>
                    <Input type="date" value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="newSpecialConditions" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Special Conditions</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="reason" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Amendment *</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={pending}>Submit Amendment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
