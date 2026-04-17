import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepState = 'completed' | 'active' | 'pending';

export interface Step {
  key: string;
  label: string;
  state: StepState;
}

export function StepIndicator({ steps, className }: { steps: Step[]; className?: string }) {
  return (
    <div className={cn('rounded-lg bg-blue-50 p-4', className)}>
      <div className="flex items-center gap-2">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <div key={step.key} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-8 w-8 rounded-full grid place-items-center text-xs font-semibold shrink-0',
                    step.state === 'completed' && 'bg-emerald-500 text-white',
                    step.state === 'active' && 'bg-blue-600 text-white',
                    step.state === 'pending' && 'bg-neutral-300 text-neutral-700',
                  )}
                >
                  {step.state === 'completed' ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    step.state === 'pending' && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && <div className="h-px flex-1 bg-neutral-300/70" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
