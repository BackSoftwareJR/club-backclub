export interface NavLinkItem {
  to:
    | '/club/$clubId'
    | '/club/$clubId/wallet'
    | '/club/$clubId/settings'
    | '/club/$clubId/admin'
    | '/club/$clubId/admin/analytics'
    | '/club/$clubId/admin/security'
    | '/club/$clubId/admin/topups'
    | '/club/$clubId/admin/members'
    | '/club/$clubId/admin/products'
    | '/club/$clubId/admin/appearance'
  label: string
  shortLabel?: string
  icon: 'catalog' | 'wallet' | 'settings' | 'treasury' | 'analytics' | 'security' | 'topups' | 'members' | 'products' | 'appearance'
}

export const memberLinks: NavLinkItem[] = [
  { to: '/club/$clubId', label: 'Catalog', shortLabel: 'Shop', icon: 'catalog' },
  { to: '/club/$clubId/wallet', label: 'Wallet', shortLabel: 'Wallet', icon: 'wallet' },
  { to: '/club/$clubId/settings', label: 'Settings', shortLabel: 'Settings', icon: 'settings' },
]

export const adminPrimaryLinks: NavLinkItem[] = [
  { to: '/club/$clubId/admin', label: 'Treasury', shortLabel: 'Treasury', icon: 'treasury' },
  { to: '/club/$clubId/admin/members', label: 'Members', shortLabel: 'Members', icon: 'members' },
  { to: '/club/$clubId/admin/topups', label: 'Top-ups', shortLabel: 'Top-ups', icon: 'topups' },
]

export const adminOverflowLinks: NavLinkItem[] = [
  { to: '/club/$clubId/admin/security', label: 'Security Radar', icon: 'security' },
  { to: '/club/$clubId/admin/analytics', label: 'Analytics', icon: 'analytics' },
  { to: '/club/$clubId/admin/products', label: 'Products', icon: 'products' },
  { to: '/club/$clubId/admin/appearance', label: 'Aspetto', icon: 'appearance' },
  { to: '/club/$clubId/settings', label: 'Settings', icon: 'settings' },
]

export const adminLinks: NavLinkItem[] = [...adminPrimaryLinks, ...adminOverflowLinks]

export function getNavLinks(isAdmin: boolean): NavLinkItem[] {
  return isAdmin ? adminLinks : memberLinks
}

export function isNavLinkActive(pathname: string, link: NavLinkItem, clubId: number): boolean {
  const path = link.to.replace('$clubId', String(clubId))

  if (link.to === '/club/$clubId') {
    return /\/club\/\d+\/?$/.test(pathname)
  }

  if (link.to === '/club/$clubId/admin') {
    return /\/club\/\d+\/admin\/?$/.test(pathname)
  }

  return pathname === path || pathname.startsWith(`${path}/`)
}
