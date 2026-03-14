import { cn } from '@/lib/utils';
import type { Status } from '@/lib/types';

const statusConfig: Record<Status, { label: string; className: string; dotClass: string }> = {
  draft: { label: 'Draft', className: 'bg-status-draft/15 text-status-draft border-status-draft/20', dotClass: 'bg-status-draft' },
  confirmed: { label: 'Confirmed', className: 'bg-status-confirmed/15 text-status-confirmed border-status-confirmed/20', dotClass: 'bg-status-confirmed' },
  done: { label: 'Done', className: 'bg-status-done/15 text-status-done border-status-done/20', dotClass: 'bg-status-done' },
  cancelled: { label: 'Cancelled', className: 'bg-status-cancelled/15 text-status-cancelled border-status-cancelled/20', dotClass: 'bg-status-cancelled' },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const config = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono uppercase tracking-wider transition-snappy', config.className, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  );
}
