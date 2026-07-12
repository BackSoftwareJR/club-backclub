import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

interface InsufficientFundsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clubId: number
  total: number
}

export function InsufficientFundsModal({
  open,
  onOpenChange,
  clubId,
  total,
}: InsufficientFundsModalProps) {
  return (
    <Modal
      description="Your wallet balance is too low for this purchase."
      onOpenChange={onOpenChange}
      open={open}
      title="Top-Up Required"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-sm text-white/70">
            You need at least <span className="font-semibold text-amber-300">{formatCurrency(total)}</span> to
            complete this purchase.
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => onOpenChange(false)} variant="ghost">
            Go Back
          </Button>
          <Link className="flex-1" params={{ clubId: String(clubId) }} to="/club/$clubId/wallet">
            <Button className="w-full">Top Up Wallet</Button>
          </Link>
        </div>
      </div>
    </Modal>
  )
}
