import { AlertTriangle, Info, CheckCircle2, CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertTone = 'info' | 'warning' | 'danger' | 'success';

const TONE: Record<
  AlertTone,
  { card: string; title: string; icon: React.ComponentType<{ className?: string }> }
> = {
  info: { card: 'bg-blue-50 text-blue-900 border-blue-100', title: 'text-blue-900', icon: Info },
  warning: {
    card: 'bg-amber-50 text-amber-900 border-amber-100',
    title: 'text-amber-900',
    icon: AlertTriangle,
  },
  danger: {
    card: 'bg-red-50 text-red-900 border-red-100',
    title: 'text-red-700',
    icon: CircleAlert,
  },
  success: {
    card: 'bg-emerald-50 text-emerald-900 border-emerald-100',
    title: 'text-emerald-800',
    icon: CheckCircle2,
  },
};

export function AlertBanner({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const cfg = TONE[tone];
  const Icon = cfg.icon;
  return (
    <div className={cn('flex items-start gap-3 rounded-lg border px-4 py-3', cfg.card, className)}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <div className="text-sm">
        {title && <p className={cn('font-semibold', cfg.title)}>{title}</p>}
        {children && <div className="mt-0.5">{children}</div>}
      </div>
    </div>
  );
}
