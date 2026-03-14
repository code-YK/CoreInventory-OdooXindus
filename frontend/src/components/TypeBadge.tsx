import { cn } from '@/lib/utils';
import type { OperationType } from '@/lib/types';

const typeConfig: Record<OperationType, { label: string; className: string }> = {
  receipt: { label: 'Receipt', className: 'bg-stock-healthy/15 text-stock-healthy border-stock-healthy/20' },
  delivery: { label: 'Delivery', className: 'bg-status-confirmed/15 text-status-confirmed border-status-confirmed/20' },
  transfer: { label: 'Transfer', className: 'bg-status-done/15 text-status-done border-status-done/20' },
  adjustment: { label: 'Adjustment', className: 'bg-muted text-muted-foreground border-border' },
};

export function TypeBadge({ type, className }: { type: OperationType; className?: string }) {
  const config = typeConfig[type];
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono uppercase tracking-wider transition-snappy', config.className, className)}>
      {config.label}
    </span>
  );
}
