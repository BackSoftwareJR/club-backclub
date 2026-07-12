import { useEffect, useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { MoreHorizontal } from 'lucide-react'
import { AdminToggle } from '@/components/layout/AdminToggle'
import { ClubManageLinks } from '@/components/layout/ClubManageLinks'
import { NavIcon } from '@/components/layout/NavIcon'
import {
  adminManageLinks,
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
  const showMoreButton = isClubOwner

  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  const closeMore = () => setMoreOpen(false)

  return (
    <>
      <div className="glass-nav-bar safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/10 md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch gap-1 px-2 py-2">
          {primaryLinks.map((link) => (
            <TabLink key={link.to} clubId={clubId} link={link} pathname={pathname} />
          ))}
          {showMoreButton ? (
            <button
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition',
                moreOpen || (!isAdmin && isClubOwner) ? 'text-primary' : 'text-white/45 hover:text-white/75',
              )}
              onClick={() => setMoreOpen(true)}
              type="button"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium uppercase tracking-wide">
                {isAdmin ? 'Altro' : 'Admin'}
              </span>
            </button>
          ) : null}
        </div>
      </div>

      <Sheet
        description={
          isAdmin
            ? 'Strumenti admin aggiuntivi e cambio modalità.'
            : 'Passa ad Admin, gestisci prodotti e membri, cambia club.'
        }
        onOpenChange={setMoreOpen}
        open={moreOpen}
        title={isAdmin ? 'Altro' : 'Gestione club'}
      >
        <div className="space-y-4 pb-2">
          {isClubOwner ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-primary/70">Modalità</p>
              <AdminToggle compact />
              <p className="mt-2 text-xs text-white/45">
                Attiva Admin per treasury, membri e ricariche nella barra in basso.
              </p>
            </div>
          ) : null}

          {isClubOwner && !isAdmin ? (
            <div className="space-y-2">
              <p className="px-1 text-xs uppercase tracking-[0.2em] text-white/40">Gestione admin</p>
              <ClubManageLinks clubId={clubId} links={adminManageLinks} onNavigate={closeMore} />
            </div>
          ) : null}

          {isAdmin && adminOverflowLinks.length > 0 ? (
            <div className="space-y-2">
              <p className="px-1 text-xs uppercase tracking-[0.2em] text-white/40">Strumenti</p>
              {adminOverflowLinks.map((link) => (
                <Link
                  key={link.to}
                  className="glass-list-item flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm text-white/85"
                  onClick={closeMore}
                  params={{ clubId: String(clubId) }}
                  to={link.to}
                >
                  <NavIcon className="h-4 w-4 text-primary/80" icon={link.icon} />
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}

          {isClubOwner ? (
            <button
              className="glass-list-item w-full rounded-2xl px-4 py-3.5 text-left text-sm text-white/85"
              onClick={() => {
                closeMore()
                void navigate({ to: '/club/$clubId/settings', params: { clubId: String(clubId) } })
              }}
              type="button"
            >
              I miei club — cambia o gestisci
            </button>
          ) : null}
        </div>
      </Sheet>
    </>
  )
}
