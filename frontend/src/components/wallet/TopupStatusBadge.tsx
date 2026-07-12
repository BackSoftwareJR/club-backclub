import { cn } from '@/lib/utils'
import type { TopupRequest } from '@/types'

const statusStyles: Record<TopupRequest['status'], string> = {
  pending: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-300 ring-red-500/30',
}

interface TopupStatusBadgeProps {
  status: TopupRequest['status']
  className?: string
}

export function TopupStatusBadge({ status, className }: TopupStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset',
        statusStyles[status],
        className,
      )}
    >
      {status}
    </span>
  )
}
