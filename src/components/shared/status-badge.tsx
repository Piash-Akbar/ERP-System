import { Badge } from '@/components/ui/badge';

type Status = 'ACTIVE' | 'DISABLED' | 'PENDING' | 'POSTED' | 'DRAFT' | 'APPROVED' | 'REJECTED' | 'OVERDUE';

const MAP: Record<Status, { label: string; variant: 'success' | 'secondary' | 'warning' | 'destructive' | 'outline' }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  POSTED: { label: 'Posted', variant: 'success' },
  APPROVED: { label: 'Approved', variant: 'success' },
  PENDING: { label: 'Pending', variant: 'warning' },
  DRAFT: { label: 'Draft', variant: 'secondary' },
  OVERDUE: { label: 'Overdue', variant: 'destructive' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  DISABLED: { label: 'Disabled', variant: 'outline' },
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toUpperCase() as Status;
  const entry = MAP[key] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
