import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productName: string
  quantityLabel?: string
  customNote?: string
  total: number
  loading?: boolean
  onConfirm: () => void
}

export function ConfirmModal({
  open,
  onOpenChange,
  productName,
  quantityLabel,
  customNote,
  total,
  loading,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      description="Review your purchase before confirming."
      onOpenChange={onOpenChange}
      open={open}
      title="Confirm Purchase"
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-sm text-white/60">Product</p>
          <p className="text-lg">{productName}</p>
          {quantityLabel ? (
            <p className="mt-2 text-sm text-white/70">{quantityLabel}</p>
          ) : null}
          {customNote ? (
            <p className="mt-2 rounded-lg bg-black/30 p-3 text-sm text-white/80">{customNote}</p>
          ) : null}
          <p className="mt-3 text-2xl font-semibold text-primary">{formatCurrency(total)}</p>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1" disabled={loading} onClick={() => onOpenChange(false)} variant="ghost">
            Cancel
          </Button>
          <motion.div
            animate={!loading ? { scale: [1, 1.03, 1] } : undefined}
            className="flex-1"
            transition={{ duration: 1.4, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
          >
            <Button className="relative w-full overflow-hidden" disabled={loading} onClick={onConfirm}>
              {!loading ? (
                <motion.span
                  animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.9, 1.2, 1.3] }}
                  className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle,var(--color-primary),transparent_65%)]"
                  transition={{ duration: 1.3, repeat: Infinity }}
                />
              ) : null}
              <span className="relative">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processing…
                  </span>
                ) : (
                  'Conferma adesso'
                )}
              </span>
            </Button>
          </motion.div>
        </div>
      </div>
    </Modal>
  )
}
