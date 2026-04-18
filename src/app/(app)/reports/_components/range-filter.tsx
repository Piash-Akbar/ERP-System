import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  from: string;
  to: string;
  branches?: { id: string; code: string; name: string }[];
  branchId?: string;
  exportHref?: string;
}

export function RangeFilter({ from, to, branches, branchId, exportHref }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <form className="flex flex-wrap items-end gap-2">
        {branches && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Branch</label>
            <select
              name="branchId"
              defaultValue={branchId ?? ''}
              className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.code} · {b.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" name="from" defaultValue={from} className="h-9" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" name="to" defaultValue={to} className="h-9" />
        </div>
        <Button type="submit">Apply</Button>
      </form>
      {exportHref && (
        <Button asChild variant="outline">
          <a href={exportHref}>Export CSV</a>
        </Button>
      )}
    </div>
  );
}

export function defaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: start.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}
