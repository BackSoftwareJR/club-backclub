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
      description="Your coach has a note before you proceed."
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
      open={open}
      title="Coach Check-in"
    >
      <p className="mb-6 rounded-xl bg-primary/10 p-4 text-sm leading-relaxed text-white/80">
        {message}
      </p>
      <div className="flex gap-3">
        <Button className="flex-1" onClick={onCancel} variant="ghost">
          Reconsider
        </Button>
        <Button className="flex-1" onClick={onContinue}>
          Continue Anyway
        </Button>
      </div>
    </Modal>
  )
}
