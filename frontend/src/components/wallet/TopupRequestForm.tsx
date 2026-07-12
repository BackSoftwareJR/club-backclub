import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { api } from '@/lib/api'
import { useToast } from '@/providers/ToastProvider'
import { useClubId } from '@/hooks/useAuth'

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/

function validateAmount(raw: string): string | null {
  const amount = raw.trim()
  if (!amount) return 'Amount is required.'
  if (!AMOUNT_PATTERN.test(amount)) return 'Enter a valid amount (e.g. 50.00).'
  if (parseFloat(amount) <= 0) return 'Amount must be greater than zero.'
  return null
}

interface TopupRequestFormProps {
  onSuccess?: () => Promise<void>
}

export function TopupRequestForm({ onSuccess }: TopupRequestFormProps) {
  const clubId = useClubId()
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const submit = async () => {
    const validationError = validateAmount(amount)
    if (validationError) {
      setFieldError(validationError)
      return
    }

    setFieldError(null)
    setLoading(true)
    try {
      await api.createTopupRequest(clubId, amount.trim())
      toast({
        title: 'Top-up requested',
        description: 'Your request is pending admin approval.',
        variant: 'success',
      })
      setAmount('')
      await onSuccess?.()
    } catch (err) {
      toast({
        title: 'Request failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !loading) {
      void submit()
    }
  }

  return (
    <GlassPanel>
      <h3 className="mb-4 text-lg font-medium">Request Top-up</h3>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
        <div className="flex-1">
          <input
            aria-invalid={fieldError !== null}
            className="glass-panel h-11 w-full rounded-xl border-white/10 bg-black/30 px-4 text-white outline-none focus:ring-2 focus:ring-primary/40"
            disabled={loading}
            inputMode="decimal"
            onChange={(e) => {
              setAmount(e.target.value)
              if (fieldError) setFieldError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Amount (e.g. 50.00)"
            type="text"
            value={amount}
          />
          {fieldError ? <p className="mt-1.5 text-sm text-red-400">{fieldError}</p> : null}
        </div>
        <Button className="sm:mt-0" disabled={loading || !amount.trim()} onClick={() => void submit()}>
          {loading ? 'Sending…' : 'Submit'}
        </Button>
      </div>
    </GlassPanel>
  )
}
