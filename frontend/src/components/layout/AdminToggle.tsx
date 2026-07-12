import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import * as Switch from '@radix-ui/react-switch'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function AdminToggle() {
  const { isClubOwner } = useAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAdmin = pathname.includes('/admin')

  if (!isClubOwner) return null

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-2">
      <span className={cn('text-sm', !isAdmin && 'text-white/80')}>Member</span>
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
      <span className={cn('text-sm', isAdmin && 'text-primary')}>Admin Dashboard</span>
    </div>
  )
}

export function NavBar({ clubId }: { clubId: number }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAdmin = pathname.includes('/admin')

  const memberLinks = [
    { to: '/club/$clubId' as const, label: 'Catalog' },
    { to: '/club/$clubId/wallet' as const, label: 'Wallet' },
  ]

  const adminLinks = [
    { to: '/club/$clubId/admin' as const, label: 'Treasury' },
    { to: '/club/$clubId/admin/topups' as const, label: 'Top-ups' },
    { to: '/club/$clubId/admin/members' as const, label: 'Members' },
    { to: '/club/$clubId/admin/products' as const, label: 'Products' },
  ]

  const links = isAdmin ? adminLinks : memberLinks

  return (
    <nav className="mb-8 flex flex-wrap items-center justify-between gap-4">
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
