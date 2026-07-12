import {
  ChartNoAxesCombined,
  CreditCard,
  LayoutGrid,
  Paintbrush2,
  Package,
  Radar,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { NavLinkItem } from '@/components/layout/navLinks'

const iconMap: Record<NavLinkItem['icon'], LucideIcon> = {
  catalog: LayoutGrid,
  wallet: Wallet,
  settings: Settings,
  treasury: CreditCard,
  analytics: ChartNoAxesCombined,
  security: Radar,
  topups: CreditCard,
  members: Users,
  products: Package,
  appearance: Paintbrush2,
}

export function NavIcon({ icon, className }: { icon: NavLinkItem['icon']; className?: string }) {
  const Icon = iconMap[icon]
  return <Icon className={className} strokeWidth={1.5} />
}
