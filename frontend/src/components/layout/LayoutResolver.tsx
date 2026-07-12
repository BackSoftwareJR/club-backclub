import type { ComponentType, ReactNode } from 'react'
import { useTheme } from '@/hooks/useAuth'
import { SommelierChat } from '@/components/ai/SommelierChat'
import { PageTransition } from '@/components/layout/PageTransition'
import { Template1 } from '@/components/layout/templates/Template1'
import { Template2 } from '@/components/layout/templates/Template2'
import { Template3 } from '@/components/layout/templates/Template3'
import { Template4 } from '@/components/layout/templates/Template4'
import type { TemplateProps } from '@/components/layout/types'

interface LayoutResolverProps {
  clubId: number
  clubName: string
  children: ReactNode
}

const templates: Record<number, ComponentType<TemplateProps>> = {
  1: Template1,
  2: Template2,
  3: Template3,
  4: Template4,
}

export function LayoutResolver({ clubId, clubName, children }: LayoutResolverProps) {
  const { templateId } = useTheme()
  const Template = templates[templateId] ?? Template3

  return (
    <Template clubId={clubId} clubName={clubName}>
      <PageTransition>{children}</PageTransition>
      <SommelierChat />
    </Template>
  )
}
