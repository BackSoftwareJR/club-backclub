import { useEffect, useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { MoreHorizontal } from 'lucide-react'
import { AdminToggle } from '@/components/layout/AdminToggle'
import { NavIcon } from '@/components/layout/NavIcon'
import {
  adminOverflowLinks,
  adminPrimaryLinks,
  isNavLinkActive,
  memberLinks,
  type NavLinkItem,
} from '@/components/layout/navLinks'
import { Sheet } from '@/components/ui/Sheet'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface ClubTabBarProps {
  clubId: number
}

function TabLink({
  clubId,
  link,
  pathname,
}: {
  clubId: number
  link: NavLinkItem
  pathname: string
}) {
  const active = isNavLinkActive(pathname, link, clubId)

  return (
    <Link
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition',
        active ? 'text-primary' : 'text-white/45 hover:text-white/75',
      )}
      params={{ clubId: String(clubId) }}
      to={link.to}
    >
      <NavIcon className={cn('h-5 w-5', active && 'drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-primary)_50%,transparent)]')} icon={link.icon} />
      <span className="max-w-full truncate text-[10px] font-medium uppercase tracking-wide">
        {link.shortLabel ?? link.label}
      </span>
    </Link>
  )
}

export function ClubTabBar({ clubId }: ClubTabBarProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { isClubOwner } = useAuth()
  const navigate = useNavigate()
  const isAdmin = pathname.includes('/admin')
  const [moreOpen, setMoreOpen] = useState(false)

  const primaryLinks = isAdmin ? adminPrimaryLinks : memberLinks
  const overflowLinks = isAdmin ? adminOverflowLinks : []

  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  return (
    <>
      <div className="glass-nav-bar safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/10 md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch gap-1 px-2 py-2">
          {primaryLinks.map((link) => (
            <TabLink key={link.to} clubId={clubId} link={link} pathname={pathname} />
          ))}
          {isAdmin && overflowLinks.length > 0 ? (
            <button
              className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-white/45 transition hover:text-white/75"
              onClick={() => setMoreOpen(true)}
              type="button"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium uppercase tracking-wide">More</span>
            </button>
          ) : null}
        </div>
      </div>

      <Sheet
        description="Quick access to admin tools and account settings."
        onOpenChange={setMoreOpen}
        open={moreOpen}
        title="More"
      >
        <div className="space-y-2 pb-2">
          {overflowLinks.map((link) => (
            <Link
              key={link.to}
              className="glass-list-item flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm text-white/85"
              onClick={() => setMoreOpen(false)}
              params={{ clubId: String(clubId) }}
              to={link.to}
            >
              <NavIcon className="h-4 w-4 text-primary/80" icon={link.icon} />
              {link.label}
            </Link>
          ))}
          {isClubOwner ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">Mode</p>
              <AdminToggle compact />
            </div>
          ) : null}
          {!isAdmin && isClubOwner ? (
            <button
              className="glass-list-item w-full rounded-2xl px-4 py-3.5 text-left text-sm text-white/85"
              onClick={() => {
                setMoreOpen(false)
                void navigate({ to: '/club/$clubId/admin', params: { clubId: String(clubId) } })
              }}
              type="button"
            >
              Open Admin Dashboard
            </button>
          ) : null}
        </div>
      </Sheet>
    </>
  )
}
