'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createShipmentSchema } from '@/server/validators/trade';
import { createTradeShipment } from '@/server/actions/trade';

type FormValues = z.infer<typeof createShipmentSchema>;

export function AddShipmentButton({ tradeOrderId }: { tradeOrderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: { tradeOrderId },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await createTradeShipment(values);
      if (res.success) {
        toast.success('Shipment recorded');
        setOpen(false);
        form.reset({ tradeOrderId });
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-3 w-3" />
        Add Shipment
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Shipment</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="vesselName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vessel Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="voyageNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voyage Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="blNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>BL Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="blDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>BL Date</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="carrierName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="bookingRef" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Ref</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="etd" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ETD</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="eta" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ETA</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="containerNumbers" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Container Numbers</FormLabel>
                    <FormControl><Input placeholder="MSCU1234567, HLXU9876543" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="grossWeight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gross Weight (kg)</FormLabel>
                    <FormControl><Input type="number" step="0.001" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="packages" render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. of Packages</FormLabel>
                    <FormControl><Input type="number" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
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
                <Button type="submit" disabled={pending}>Save Shipment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
