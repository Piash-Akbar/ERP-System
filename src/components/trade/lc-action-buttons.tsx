'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { updateLCStatus } from '@/server/actions/trade';

interface Props {
  lc: { id: string; status: string };
}

const TRANSITIONS: Record<string, { label: string; status: string }[]> = {
  DRAFT: [{ label: 'Mark as Issued', status: 'ISSUED' }, { label: 'Cancel', status: 'CANCELLED' }],
  ISSUED: [{ label: 'Mark Advised', status: 'ADVISED' }, { label: 'Mark Active', status: 'ACTIVE' }, { label: 'Cancel', status: 'CANCELLED' }],
  ADVISED: [{ label: 'Mark Confirmed', status: 'CONFIRMED' }, { label: 'Mark Active', status: 'ACTIVE' }],
  CONFIRMED: [{ label: 'Mark Active', status: 'ACTIVE' }],
  ACTIVE: [{ label: 'Close LC', status: 'CLOSED' }, { label: 'Mark Expired', status: 'EXPIRED' }],
  AMENDED: [{ label: 'Mark Active', status: 'ACTIVE' }],
};

export function LCActionButtons({ lc }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const actions = TRANSITIONS[lc.status] ?? [];

  if (actions.length === 0) return null;

  function changeStatus(status: string) {
    startTransition(async () => {
      const res = await updateLCStatus({ lcId: lc.id, status });
      if (res.success) {
        toast.success(res.message ?? 'Status updated');
        router.refresh();
      } else {
        toast.error(res.error);
      }
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
        {actions.map((a, i) => (
          <DropdownMenuItem key={i} onClick={() => changeStatus(a.status)}>
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
