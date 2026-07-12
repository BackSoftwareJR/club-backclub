import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface AiFrictionModalProps {
  open: boolean
  message: string
  onContinue: () => void
  onCancel: () => void
}

export function AiFrictionModal({ open, message, onContinue, onCancel }: AiFrictionModalProps) {
  return (
    <Modal
      className="border-primary/20 bg-black/40"
      description="Read the coach's note before confirming your purchase."
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
      open={open}
      title="Coach Check-in"
    >
      <div className="glass-panel mb-6 border-primary/25 bg-primary/5 p-5 shadow-inner">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary/80">
          <Sparkles className="h-3.5 w-3.5" />
          Coach
        </div>
        <p className="text-sm leading-relaxed text-white/85">{message}</p>
      </div>
      <div className="flex gap-3">
        <Button className="flex-1" onClick={onCancel} variant="ghost">
          Reconsider
        </Button>
        <Button className="flex-1" onClick={onContinue}>
          Confirm Purchase
        </Button>
      </div>
    </Modal>
  )
}
