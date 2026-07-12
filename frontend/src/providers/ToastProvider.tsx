import * as Toast from '@radix-ui/react-toast'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'success' | 'error'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (opts: { title: string; description?: string; variant?: ToastVariant }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback(
    ({
      title,
      description,
      variant = 'default',
    }: {
      title: string
      description?: string
      variant?: ToastVariant
    }) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, title, description, variant }])
    },
    [],
  )

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {toasts.map((item) => (
          <Toast.Root
            key={item.id}
            className={cn(
              'glass-panel fixed bottom-4 right-4 z-[100] w-[min(90vw,360px)] p-4 shadow-2xl',
              item.variant === 'success' && 'border-primary/40',
              item.variant === 'error' && 'border-red-500/40',
            )}
            duration={4000}
            onOpenChange={(open) => {
              if (!open) remove(item.id)
            }}
            open
          >
            <Toast.Title className="font-medium text-white">{item.title}</Toast.Title>
            {item.description ? (
              <Toast.Description className="mt-1 text-sm text-white/70">
                {item.description}
              </Toast.Description>
            ) : null}
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]" />
      </Toast.Provider>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
