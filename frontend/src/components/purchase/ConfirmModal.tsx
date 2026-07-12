import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productName: string
  total: number
  loading?: boolean
  onConfirm: () => void
}

export function ConfirmModal({
  open,
  onOpenChange,
  productName,
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
          <p className="mt-2 text-2xl font-semibold text-primary">{formatCurrency(total)}</p>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => onOpenChange(false)} variant="ghost">
            Cancel
          </Button>
          <Button className="flex-1" disabled={loading} onClick={onConfirm}>
            {loading ? 'Processing…' : 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
