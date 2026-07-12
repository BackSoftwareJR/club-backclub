import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                animate={{ y: 0, opacity: 1 }}
                className={cn(
                  'glass-sheet fixed inset-x-0 bottom-0 z-50 max-h-[min(92vh,720px)] overflow-y-auto rounded-t-[28px] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl',
                  className,
                )}
                exit={{ y: '100%', opacity: 0 }}
                initial={{ y: '100%', opacity: 0 }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" aria-hidden />
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="text-xl font-semibold tracking-tight text-white">
                      {title}
                    </Dialog.Title>
                    {description ? (
                      <Dialog.Description className="mt-1 text-sm leading-relaxed text-white/55">
                        {description}
                      </Dialog.Description>
                    ) : null}
                  </div>
                  <Dialog.Close className="rounded-full p-2 text-white/55 transition hover:bg-white/10 hover:text-white">
                    <X className="h-5 w-5" />
                  </Dialog.Close>
                </div>
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  )
}
