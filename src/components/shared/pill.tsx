import { cn } from '@/lib/utils';

export type PillTone =
  | 'neutral'
  | 'black'
  | 'blue'
  | 'green'
  | 'amber'
  | 'red'
  | 'orange'
  | 'grey';

const TONE: Record<PillTone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  grey: 'bg-neutral-100 text-neutral-500',
  black: 'bg-neutral-900 text-white',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
};

export function Pill({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
