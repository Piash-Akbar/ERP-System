import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export type KpiTone = 'default' | 'success' | 'warning' | 'danger' | 'primary';

const TONE_VALUE: Record<KpiTone, string> = {
  default: 'text-foreground',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
  primary: 'text-blue-600',
};

export function KpiCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'default',
  className,
}: {
  label: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  tone?: KpiTone;
  className?: string;
}) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>
      <p className={cn('mt-2 text-3xl font-semibold tabular', TONE_VALUE[tone])}>{value}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </Card>
  );
}
