export interface NavLinkItem {
  to: '/club/$clubId' | '/club/$clubId/wallet' | '/club/$clubId/admin' | '/club/$clubId/admin/topups' | '/club/$clubId/admin/members' | '/club/$clubId/admin/products'
  label: string
  icon: 'catalog' | 'wallet' | 'treasury' | 'topups' | 'members' | 'products'
}

export const memberLinks: NavLinkItem[] = [
  { to: '/club/$clubId', label: 'Catalog', icon: 'catalog' },
  { to: '/club/$clubId/wallet', label: 'Wallet', icon: 'wallet' },
]

export const adminLinks: NavLinkItem[] = [
  { to: '/club/$clubId/admin', label: 'Treasury', icon: 'treasury' },
  { to: '/club/$clubId/admin/topups', label: 'Top-ups', icon: 'topups' },
  { to: '/club/$clubId/admin/members', label: 'Members', icon: 'members' },
  { to: '/club/$clubId/admin/products', label: 'Products', icon: 'products' },
]

export function getNavLinks(isAdmin: boolean): NavLinkItem[] {
  return isAdmin ? adminLinks : memberLinks
}
