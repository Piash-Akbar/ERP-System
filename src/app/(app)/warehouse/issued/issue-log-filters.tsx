'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

export function IssueLogFilters({ warehouses }: { warehouses: Warehouse[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const push = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const clear = () => {
    router.push(pathname);
  };

  const hasFilters =
    searchParams.has('warehouseId') ||
    searchParams.has('from') ||
    searchParams.has('to') ||
    searchParams.has('refType');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={searchParams.get('warehouseId') ?? ''}
        onValueChange={(v) => push('warehouseId', v === 'all' ? '' : v)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All warehouses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All warehouses</SelectItem>
          {warehouses.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.name} ({w.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('refType') ?? ''}
        onValueChange={(v) => push('refType', v === 'all' ? '' : v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="SALE">Sale</SelectItem>
          <SelectItem value="DAMAGE">Damage</SelectItem>
          <SelectItem value="MANUAL_ADJUST">Manual adjust</SelectItem>
          <SelectItem value="PRODUCTION">Production</SelectItem>
          <SelectItem value="TRANSFER">Transfer</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="date"
        className="w-36"
        value={searchParams.get('from') ?? ''}
        onChange={(e) => push('from', e.target.value)}
        placeholder="From"
      />
      <Input
        type="date"
        className="w-36"
        value={searchParams.get('to') ?? ''}
        onChange={(e) => push('to', e.target.value)}
        placeholder="To"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="gap-1">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
