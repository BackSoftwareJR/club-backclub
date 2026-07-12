import { useIsMobile } from '@/hooks/useMediaQuery'
import { Modal } from '@/components/ui/Modal'
import { Sheet } from '@/components/ui/Sheet'
import type { ReactNode } from 'react'

interface AdaptiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

/** Apple-style surface: bottom sheet on phone, centered glass modal on desktop. */
export function AdaptiveModal(props: AdaptiveModalProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <Sheet {...props} />
  }

  return <Modal {...props} />
}
