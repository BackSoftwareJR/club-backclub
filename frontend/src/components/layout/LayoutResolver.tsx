import type { ReactNode } from 'react'
import { useTheme } from '@/hooks/useAuth'
import { SommelierChat } from '@/components/ai/SommelierChat'
import { NavBar } from '@/components/layout/AdminToggle'
import { Template1 } from '@/components/layout/templates/Template1'
import { Template2 } from '@/components/layout/templates/Template2'
import { Template3 } from '@/components/layout/templates/Template3'

interface LayoutResolverProps {
  clubId: number
  clubName: string
  children: ReactNode
}

export function LayoutResolver({ clubId, clubName, children }: LayoutResolverProps) {
  const { templateId } = useTheme()

  const templates: Record<number, typeof Template1> = {
    1: Template1,
    2: Template2,
    3: Template3,
  }

  const Template = templates[templateId] ?? Template3

  return (
    <Template clubName={clubName}>
      <NavBar clubId={clubId} />
      {children}
      <SommelierChat />
    </Template>
  )
}
