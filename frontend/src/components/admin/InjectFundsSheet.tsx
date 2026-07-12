import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AmountChipRow, GlassFieldLabel, GlassInput, GlassTextarea } from '@/components/ui/GlassField'
import { AdaptiveModal } from '@/components/ui/AdaptiveModal'
import { api } from '@/lib/api'
import { formatCurrency, parsePositiveAmount } from '@/lib/utils'
import { useToast } from '@/providers/ToastProvider'
import type { Member } from '@/types'

interface InjectFundsSheetProps {
  clubId: number
  member: Member | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
}

export function InjectFundsSheet({
  clubId,
  member,
  open,
  onOpenChange,
  onSuccess,
}: InjectFundsSheetProps) {
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const memberLabel = member?.email ?? (member ? `User #${member.user_id}` : 'Member')
  const amountValid = parsePositiveAmount(amount) !== null

  const close = () => {
    onOpenChange(false)
    setAmount('')
    setDescription('')
  }

  const submit = async () => {
    if (!member) return

    const parsedAmount = parsePositiveAmount(amount)
    if (!parsedAmount) {
      toast({ title: 'Enter a valid amount', variant: 'error' })
      return
    }

    setLoading(true)
    try {
      const result = await api.adminInjection(clubId, {
        user_id: member.user_id,
        amount: parsedAmount,
        description: description.trim() || `Credit for ${memberLabel}`,
      })
      toast({
        title: 'Funds added',
        description: `${memberLabel} · ${formatCurrency(result.new_balance)}`,
        variant: 'success',
      })
      close()
      await onSuccess()
    } catch (err) {
      toast({
        title: 'Could not add funds',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdaptiveModal
      description={
        member
          ? `Credit wallet for ${memberLabel}. Current balance: ${formatCurrency(member.wallet_balance ?? '0')}`
          : undefined
      }
      onOpenChange={(next) => {
        if (!next) close()
        else onOpenChange(true)
      }}
      open={open}
      title="Add funds"
    >
      <div className="space-y-5">
        <AmountChipRow amounts={[10, 25, 50, 100, 250]} onPick={setAmount} />

        <div>
          <GlassFieldLabel htmlFor="inject-amount">Amount (EUR)</GlassFieldLabel>
          <GlassInput
            autoComplete="off"
            id="inject-amount"
            inputMode="decimal"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="50.00"
            type="text"
            value={amount}
          />
        </div>

        <div>
          <GlassFieldLabel hint="Optional" htmlFor="inject-description">
            Note
          </GlassFieldLabel>
          <GlassTextarea
            id="inject-description"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Monthly allowance, event credit, correction…"
            value={description}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button className="flex-1" onClick={close} variant="ghost">
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={loading || !member || !amountValid}
            onClick={() => void submit()}
          >
            {loading ? 'Adding…' : 'Confirm credit'}
          </Button>
        </div>
      </div>
    </AdaptiveModal>
  )
}
