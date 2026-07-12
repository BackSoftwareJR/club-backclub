import {
  CreditCard,
  LayoutGrid,
  Package,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { NavLinkItem } from '@/components/layout/navLinks'

const iconMap: Record<NavLinkItem['icon'], LucideIcon> = {
  catalog: LayoutGrid,
  wallet: Wallet,
  treasury: CreditCard,
  topups: CreditCard,
  members: Users,
  products: Package,
}

export function NavIcon({ icon, className }: { icon: NavLinkItem['icon']; className?: string }) {
  const Icon = iconMap[icon]
  return <Icon className={className} strokeWidth={1.5} />
}
