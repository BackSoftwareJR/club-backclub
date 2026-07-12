import { Link } from '@tanstack/react-router'
import { NavIcon } from '@/components/layout/NavIcon'
import type { NavLinkItem } from '@/components/layout/navLinks'
import { cn } from '@/lib/utils'

interface ClubManageLinksProps {
  clubId: number
  links: NavLinkItem[]
  onNavigate?: () => void
  className?: string
  compact?: boolean
}

export function ClubManageLinks({
  clubId,
  links,
  onNavigate,
  className,
  compact = false,
}: ClubManageLinksProps) {
  if (compact) {
    return (
      <div className={cn('grid grid-cols-2 gap-2', className)}>
        {links.map((link) => (
          <Link
            key={link.to}
            className="flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/85 transition hover:border-primary/30 hover:bg-primary/5"
            onClick={onNavigate}
            params={{ clubId: String(clubId) }}
            to={link.to}
          >
            <NavIcon className="h-4 w-4 shrink-0 text-primary/80" icon={link.icon} />
            <span className="truncate">{link.label}</span>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {links.map((link) => (
        <Link
          key={link.to}
          className="glass-list-item flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm text-white/85"
          onClick={onNavigate}
          params={{ clubId: String(clubId) }}
          to={link.to}
        >
          <NavIcon className="h-4 w-4 text-primary/80" icon={link.icon} />
          {link.label}
        </Link>
      ))}
    </div>
  )
}
