'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { updateTradeOrderStatus } from '@/server/actions/trade';

const NEXT_STATUSES: Record<string, { label: string; status: string }[]> = {
  DRAFT: [{ label: 'Confirm Order', status: 'CONFIRMED' }, { label: 'Cancel', status: 'CANCELLED' }],
  CONFIRMED: [{ label: 'Move to Production', status: 'IN_PRODUCTION' }, { label: 'Ready to Ship', status: 'READY_TO_SHIP' }, { label: 'Cancel', status: 'CANCELLED' }],
  IN_PRODUCTION: [{ label: 'Ready to Ship', status: 'READY_TO_SHIP' }],
  READY_TO_SHIP: [{ label: 'Mark Shipped', status: 'SHIPPED' }],
  SHIPPED: [{ label: 'At Customs', status: 'AT_CUSTOMS' }, { label: 'Delivered', status: 'DELIVERED' }],
  AT_CUSTOMS: [{ label: 'Mark Delivered', status: 'DELIVERED' }],
  DELIVERED: [{ label: 'Complete', status: 'COMPLETED' }],
};

export function TradeOrderStatusActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const actions = NEXT_STATUSES[currentStatus] ?? [];

  if (actions.length === 0) return null;

  function act(status: string) {
    startTransition(async () => {
      const res = await updateTradeOrderStatus({ orderId, status: status as never });
      if (res.success) { toast.success('Status updated'); router.refresh(); }
      else toast.error(res.error);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={pending}>
          Actions <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((a) => (
          <DropdownMenuItem key={a.status} onClick={() => act(a.status)}>{a.label}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
