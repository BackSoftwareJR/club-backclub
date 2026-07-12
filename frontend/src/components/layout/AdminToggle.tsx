import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import * as Switch from '@radix-ui/react-switch'
import { useAuth } from '@/hooks/useAuth'
import { getNavLinks } from '@/components/layout/navLinks'
import { NavIcon } from '@/components/layout/NavIcon'
import { cn } from '@/lib/utils'

export function AdminToggle({ compact = false }: { compact?: boolean }) {
  const { isClubOwner } = useAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAdmin = pathname.includes('/admin')

  if (!isClubOwner) return null

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-white/10 bg-white/5',
        compact ? 'px-3 py-2' : 'px-4 py-2.5',
      )}
    >
      <span className={cn('text-xs', !isAdmin && 'text-white/80')}>Member</span>
      <Switch.Root
        checked={isAdmin}
        className="relative h-6 w-11 rounded-full bg-white/10 data-[state=checked]:bg-primary/80"
        onCheckedChange={(checked) => {
          const clubMatch = pathname.match(/\/club\/(\d+)/)
          const clubId = clubMatch?.[1]
          if (!clubId) return
          void navigate({
            to: checked ? '/club/$clubId/admin' : '/club/$clubId',
            params: { clubId },
          })
        }}
      >
        <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[22px]" />
      </Switch.Root>
      <span className={cn('text-xs', isAdmin && 'text-primary')}>Admin</span>
    </div>
  )
}

export function SideNav({ clubId }: { clubId: number }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAdmin = pathname.includes('/admin')
  const links = getNavLinks(isAdmin)

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => (
        <Link
          key={link.to}
          activeProps={{ className: 'bg-primary/15 text-primary border-primary/30 shadow-[inset_3px_0_0_var(--color-primary)]' }}
          className="flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm transition hover:bg-white/5"
          params={{ clubId: String(clubId) }}
          to={link.to}
        >
          <NavIcon className="h-4 w-4 shrink-0 opacity-70" icon={link.icon} />
          {link.label}
        </Link>
      ))}
      <div className="mt-6 border-t border-white/10 pt-6">
        <AdminToggle />
      </div>
    </nav>
  )
}

export function BottomTabs({ clubId }: { clubId: number }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAdmin = pathname.includes('/admin')
  const links = getNavLinks(isAdmin)

  return (
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/60 backdrop-blur-xl safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
        {links.map((link) => (
          <Link
            key={link.to}
            activeProps={{ className: 'text-primary' }}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] uppercase tracking-wider text-white/50 transition hover:text-white/80"
            params={{ clubId: String(clubId) }}
            to={link.to}
          >
            <NavIcon className="h-5 w-5" icon={link.icon} />
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

export function TopNav({ clubId }: { clubId: number }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAdmin = pathname.includes('/admin')
  const links = getNavLinks(isAdmin)

  return (
    <nav className="hidden flex-wrap items-center justify-between gap-4 md:flex">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.to}
            activeProps={{ className: 'bg-primary/20 text-primary border-primary/30' }}
            className="rounded-xl border border-transparent px-4 py-2 text-sm transition hover:bg-white/5"
            params={{ clubId: String(clubId) }}
            to={link.to}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <AdminToggle />
    </nav>
  )
}

export function MinimalNav({ clubId }: { clubId: number }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAdmin = pathname.includes('/admin')
  const links = getNavLinks(isAdmin)

  return (
    <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {links.map((link) => (
        <Link
          key={link.to}
          activeProps={{ className: 'text-primary underline decoration-primary/50 underline-offset-4' }}
          className="text-sm text-white/50 transition hover:text-white/80"
          params={{ clubId: String(clubId) }}
          to={link.to}
        >
          {link.label}
        </Link>
      ))}
      <AdminToggle compact />
    </nav>
  )
}
