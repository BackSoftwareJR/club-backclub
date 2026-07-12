import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { AmountChipRow, GlassFieldLabel, GlassInput } from '@/components/ui/GlassField'
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

  return (
    <GlassPanel className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Request top-up</h3>
        <p className="mt-1 text-sm text-white/50">Ask the club admin to credit your wallet.</p>
      </div>
      <AmountChipRow amounts={[20, 50, 100, 200]} onPick={setAmount} />
      <div>
        <GlassFieldLabel htmlFor="topup-amount">Amount (EUR)</GlassFieldLabel>
        <GlassInput
          aria-invalid={fieldError !== null}
          disabled={loading}
          id="topup-amount"
          inputMode="decimal"
          onChange={(event) => {
            setAmount(event.target.value)
            if (fieldError) setFieldError(null)
          }}
          placeholder="50.00"
          type="text"
          value={amount}
        />
        {fieldError ? <p className="mt-1.5 text-sm text-red-400">{fieldError}</p> : null}
      </div>
      <Button className="w-full" disabled={loading || !amount.trim()} onClick={() => void submit()}>
        {loading ? 'Sending…' : 'Submit request'}
      </Button>
    </GlassPanel>
  )
}
